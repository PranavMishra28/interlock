import type { SlackEnvelope } from "./slack-event";

export async function openSlackSocket(
  appToken: string,
  onEnvelope: (envelope: SlackEnvelope) => Promise<void>,
  request: typeof fetch = fetch,
) {
  const response = await request("https://slack.com/api/apps.connections.open", {
    method: "POST",
    headers: { authorization: `Bearer ${appToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json() as { ok?: boolean; url?: string; error?: string };
  if (!body.ok || !body.url) {
    throw new Error(`Slack Socket Mode connect failed (${body.error ?? response.status}).`);
  }
  const socket = new WebSocket(body.url);
  socket.addEventListener("message", (event) => {
    const envelope = JSON.parse(String(event.data)) as SlackEnvelope & { type?: string };
    if (envelope.envelope_id && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ envelope_id: envelope.envelope_id }));
    }
    if (envelope.type === "hello" || envelope.type === "disconnect") return;
    void onEnvelope(envelope).catch((error: unknown) => {
      console.error(`  slack envelope failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("Slack Socket Mode websocket failed.")), { once: true });
  });
  // ponytail: one connection, no auto-reconnect; reconnect on process restart / Ctrl-C retry
  return socket;
}
