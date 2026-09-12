import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InterlockStore } from "./interlock-store";

export function createCoordinator(store: InterlockStore): Server {
  return createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/v1/snapshot") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    const workflow = store.list()[0] ?? null;
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json",
    });
    response.end(
      JSON.stringify({
        asOf: Date.now(),
        coordinator: { connected: true },
        listener: { connected: false, reason: "Slack access not configured" },
        workflow,
        samples: workflow ? store.samples(workflow.contract.id) : [],
      }),
    );
  });
}

function start() {
  const path = resolve(process.env.INTERLOCK_DB_PATH ?? ".interlock/interlock.db");
  const port = Number(process.env.INTERLOCK_COORDINATOR_PORT ?? 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("INTERLOCK_COORDINATOR_PORT must be an integer from 1 to 65535.");
  }
  const store = new InterlockStore(path);
  const server = createCoordinator(store);
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
