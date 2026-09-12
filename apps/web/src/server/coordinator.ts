import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InterlockStore } from "./interlock-store";
import type { SourceMessage } from "agent-core/interlock";
import { InterlockCoordinator } from "./interlock-coordinator";

type CoordinatorOptions = {
  ingressToken?: string;
  allowedWorkspaceId?: string;
  allowedChannelId?: string;
  workflowCoordinator?: InterlockCoordinator;
  now?: () => number;
};

function sameSecret(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isSourceMessage(value: unknown): value is SourceMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return [
    "deliveryId",
    "logicalMessageId",
    "revisionId",
    "workspaceId",
    "channelId",
    "threadRef",
    "actorId",
    "text",
  ].every((key) => typeof message[key] === "string") &&
    typeof message.updated === "boolean";
}

async function readJson(request: IncomingMessage) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 16_000) throw new Error("request_too_large");
  }
  return JSON.parse(body) as unknown;
}

export function createCoordinator(
  store: InterlockStore,
  options: CoordinatorOptions = {},
): Server {
  const now = options.now ?? Date.now;
  let listenerLastSeenAt: number | undefined;
  let listenerReportedOffline = false;
  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/v1/snapshot") {
      const workflow = store.list()[0] ?? null;
      const heartbeatAge = listenerLastSeenAt == null
        ? undefined
        : now() - listenerLastSeenAt;
      const listenerConfigured = Boolean(
        options.ingressToken &&
        options.allowedWorkspaceId &&
        options.allowedChannelId,
      );
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "application/json",
      });
      response.end(
        JSON.stringify({
          asOf: now(),
          coordinator: { connected: true },
          listener: heartbeatAge != null && heartbeatAge <= 30_000
            ? { connected: true, lastSeenAt: listenerLastSeenAt }
            : {
                connected: false,
                reason: listenerConfigured
                  ? listenerReportedOffline
                    ? "Slack listener reported offline"
                    : heartbeatAge == null
                    ? "No Slack listener heartbeat received"
                    : "Slack listener heartbeat is stale"
                  : "Slack access not configured",
              },
          workflow,
          samples: workflow ? store.samples(workflow.contract.id) : [],
        }),
      );
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/v1/slack/heartbeat" &&
      options.ingressToken &&
      options.allowedWorkspaceId &&
      options.allowedChannelId
    ) {
      const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
      if (!sameSecret(token, options.ingressToken)) {
        response.writeHead(401).end();
        return;
      }
      try {
        const input = await readJson(request) as Record<string, unknown>;
        if (
          input.workspaceId !== options.allowedWorkspaceId ||
          input.channelId !== options.allowedChannelId ||
          typeof input.online !== "boolean"
        ) {
          response.writeHead(400).end();
          return;
        }
        listenerReportedOffline = !input.online;
        listenerLastSeenAt = input.online ? now() : undefined;
        response.writeHead(204).end();
      } catch {
        response.writeHead(400).end();
      }
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/v1/slack/events" &&
      options.ingressToken &&
      options.allowedWorkspaceId &&
      options.allowedChannelId
    ) {
      const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
      if (!sameSecret(token, options.ingressToken)) {
        response.writeHead(401).end();
        return;
      }
      try {
        const message = await readJson(request);
        if (
          !isSourceMessage(message) ||
          message.workspaceId !== options.allowedWorkspaceId ||
          message.channelId !== options.allowedChannelId
        ) {
          response.writeHead(400).end();
          return;
        }
        const created = store.ingestSource(message);
        response.writeHead(created ? 201 : 200, { "content-type": "application/json" });
        response.end(JSON.stringify({ accepted: created }));
      } catch {
        response.writeHead(400).end();
      }
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/v1/slack/approve" &&
      options.ingressToken &&
      options.allowedWorkspaceId &&
      options.workflowCoordinator
    ) {
      const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
      if (!sameSecret(token, options.ingressToken)) {
        response.writeHead(401).end();
        return;
      }
      try {
        const input = await readJson(request) as Record<string, unknown>;
        if (
          typeof input.workflowId !== "string" ||
          typeof input.actorId !== "string" ||
          input.workspaceId !== options.allowedWorkspaceId ||
          typeof input.revision !== "number"
        ) {
          response.writeHead(400).end();
          return;
        }
        const workflow = options.workflowCoordinator.approve(
          input.workflowId,
          input.actorId,
          input.revision,
        );
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ status: workflow.status }));
      } catch {
        response.writeHead(403).end();
      }
      return;
    }

    {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
    }
  });
}

function start() {
  const path = resolve(process.env.INTERLOCK_DB_PATH ?? ".interlock/interlock.db");
  const port = Number(process.env.INTERLOCK_COORDINATOR_PORT ?? 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("INTERLOCK_COORDINATOR_PORT must be an integer from 1 to 65535.");
  }
  const store = new InterlockStore(path);
  const resourceId = process.env.INTERLOCK_RESOURCE_ID;
  const targetUrl = process.env.INTERLOCK_TARGET_URL;
  const candidateRevision = process.env.INTERLOCK_TARGET_REVISION;
  const ownerId = process.env.INTERLOCK_OWNER_ID;
  const workflowCoordinator =
    resourceId && targetUrl && candidateRevision && ownerId
      ? new InterlockCoordinator(store, {
          resourceId,
          targetUrl,
          candidateRevision,
          ownerId,
        })
      : undefined;
  const server = createCoordinator(store, {
    ingressToken: process.env.INTERLOCK_COORDINATOR_TOKEN,
    allowedWorkspaceId: process.env.INTERLOCK_SLACK_WORKSPACE_ID,
    allowedChannelId: process.env.INTERLOCK_SLACK_CHANNEL_ID,
    workflowCoordinator,
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Interlock coordinator listening on http://127.0.0.1:${port}`);
  });
  const close = () => server.close(() => {
    store.close();
    process.exit(0);
  });
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start();
