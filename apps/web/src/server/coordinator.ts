import { createHash, createHmac, timingSafeEqual } from "node:crypto";
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

function approvalCapability(token: string, workflow: {
  contract: {
    id: string;
    revision: number;
    resourceId: string;
    candidateRevision: string;
  };
}) {
  const { id, revision, resourceId, candidateRevision } = workflow.contract;
  return createHmac("sha256", token)
    .update(`${id}\0${revision}\0${resourceId}\0${candidateRevision}`)
    .digest("hex");
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
      request.url === "/v1/slack/proposals" &&
      options.ingressToken &&
      options.allowedWorkspaceId &&
      options.allowedChannelId &&
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
          input.workspaceId !== options.allowedWorkspaceId ||
          input.channelId !== options.allowedChannelId ||
          input.resourceId !== options.workflowCoordinator.trusted.resourceId ||
          input.candidateRevision !== options.workflowCoordinator.trusted.candidateRevision ||
          typeof input.threadRef !== "string" ||
          typeof input.threshold !== "number" ||
          !Number.isFinite(input.threshold) ||
          input.threshold < 0 ||
          typeof input.windowMs !== "number" ||
          !Number.isInteger(input.windowMs) ||
          input.windowMs < 1 ||
          input.windowMs > 3_600_000
        ) {
          response.writeHead(400).end();
          return;
        }
        const source = store.sourceContext(input.threadRef).at(-1);
        if (
          !source ||
          source.workspaceId !== options.allowedWorkspaceId ||
          source.channelId !== options.allowedChannelId
        ) {
          response.writeHead(409).end();
          return;
        }
        const digest = createHash("sha256").update(source.revisionId).digest();
        const workflowId = `hold-${digest.toString("hex").slice(0, 12)}`;
        const existing = store.get(workflowId);
        const workflow = existing ?? options.workflowCoordinator.propose({
          id: workflowId,
          revision: digest.readUInt32BE(0) || 1,
          sourceDeliveryId: source.deliveryId,
          sourceMessageRef: `${source.channelId}:${source.logicalMessageId}`,
          ...options.workflowCoordinator.trusted,
          threshold: input.threshold,
          windowMs: input.windowMs,
          maxSampleAgeMs: 15_000,
          maxSampleGapMs: 20_000,
          proposalExpiresAt: now() + 300_000,
        }, now());
        response.writeHead(existing ? 200 : 201, {
          "content-type": "application/json",
        });
        response.end(JSON.stringify({
          workflowId: workflow.contract.id,
          revision: workflow.contract.revision,
          resourceId: workflow.contract.resourceId,
          candidateRevision: workflow.contract.candidateRevision,
          cardToken: approvalCapability(options.ingressToken, workflow),
          condition:
            `Health must remain at or below ${workflow.contract.threshold} for ${workflow.contract.windowMs / 1_000} seconds.`,
        }));
      } catch {
        response.writeHead(409).end();
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
          typeof input.resourceId !== "string" ||
          typeof input.candidateRevision !== "string" ||
          typeof input.cardToken !== "string" ||
          input.workspaceId !== options.allowedWorkspaceId ||
          typeof input.revision !== "number"
        ) {
          response.writeHead(400).end();
          return;
        }
        const pending = store.get(input.workflowId);
        if (
          !pending ||
          pending.contract.resourceId !== input.resourceId ||
          pending.contract.candidateRevision !== input.candidateRevision ||
          !sameSecret(
            input.cardToken,
            approvalCapability(options.ingressToken, pending),
          )
        ) {
          response.writeHead(403).end();
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
