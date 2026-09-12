// Demo checkout target for Interlock. Serves one health number that the
// coordinator reads back independently, plus a token-guarded fault switch so a
// rehearsal can make health genuinely degrade instead of faking a reset.
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const REVISION = process.env.K_REVISION ?? "unknown";
const FAULT_TOKEN = process.env.FAULT_TOKEN ?? "";
const HEALTHY = 0.1;
const UNHEALTHY = 0.9;

let faulted = false;

function sameSecret(actual, expected) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify({
      value: faulted ? UNHEALTHY : HEALTHY,
      observedAt: Date.now(),
      revision: REVISION,
    }));
    return;
  }

  // Rehearsal-only switch. Without a configured token the fault path is closed,
  // so the deployed service cannot be degraded by an anonymous caller.
  if (request.method === "POST" && url.pathname === "/fault") {
    const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";
    if (!FAULT_TOKEN || !sameSecret(token, FAULT_TOKEN)) {
      response.writeHead(403).end();
      return;
    }
    faulted = url.searchParams.get("state") === "on";
    response.writeHead(204).end();
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
}).listen(PORT, () => {
  console.log(`checkout ${REVISION} listening on ${PORT}`);
});
