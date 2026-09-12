/**
 * There is no `channel.start()`. Attaching the Channel to a CopilotRuntime and
 * creating the listener is what starts it — which is why teardown is wired
 * before the listener exists.
 */
import { createServer } from "node:http";
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { channel } from "./channel";
import { handleSocketEnvelope } from "./direct";
import { required } from "./env";
import { reportListenerHeartbeat } from "./interlock";
import { slackAppToken, slackBotToken } from "./slack-event";
import { openSlackSocket } from "./socket-mode";

const heartbeatConfig = {
  allowedWorkspaceId: required("INTERLOCK_SLACK_WORKSPACE_ID"),
  allowedChannelId: required("INTERLOCK_SLACK_CHANNEL_ID"),
  coordinatorUrl: required("INTERLOCK_COORDINATOR_URL"),
  token: required("INTERLOCK_COORDINATOR_TOKEN"),
};

const intelligence = new CopilotKitIntelligence({
  apiKey: required("INTELLIGENCE_API_KEY"),
  // Hosted Intelligence supplies both defaults. Override both together only for
  // self-hosted — they are separate hosts, so never derive one from the other.
  apiUrl: process.env.INTELLIGENCE_API_URL,
  wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL,
});

const runtime = new CopilotRuntime({
  agents: {}, // required even though the Channel supplies the agent
  intelligence,
  channels: [channel],
});

let teardown: (() => Promise<void>) | undefined;
let heartbeatTimer: NodeJS.Timeout | undefined;
const shutdown = async () => {
  await teardown?.();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

const appToken = slackAppToken();
if (appToken) {
  const botToken = slackBotToken();
  if (!botToken.startsWith("xoxb-")) {
    console.error("Socket Mode needs INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_BOT_TOKEN (xoxb-).");
    process.exit(1);
  }
  const socket = await openSlackSocket(appToken, (envelope) =>
    handleSocketEnvelope(envelope, {
      ...heartbeatConfig,
      resourceId: required("INTERLOCK_RESOURCE_ID"),
      targetUrl: required("INTERLOCK_TARGET_URL"),
      candidateRevision: required("INTERLOCK_TARGET_REVISION"),
      ownerId: required("INTERLOCK_OWNER_ID"),
      botToken,
    }).then(() => undefined),
  );
  const heartbeat = () =>
    reportListenerHeartbeat(heartbeatConfig, socket.readyState === WebSocket.OPEN)
      .catch(() => undefined);
  await heartbeat();
  heartbeatTimer = setInterval(heartbeat, 10_000);
  teardown = async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    socket.close();
  };
  console.log(
    `\n  ✓ Socket Mode online — post an ordinary unmentioned message in the authorized incident channel.\n`,
  );
} else {
  const listener = createCopilotNodeListener({ runtime, basePath: "/api/copilotkit" });
  const channels = listener.channels;
  const server = createServer(listener);

  teardown = async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    await channels.stop();
    if (server.listening) server.close();
  };

  await channels.ready({ timeoutMs: 30_000 });

  // `ready()` is NOT proof of life — it resolves on `setup_required` too, because
  // a declared-but-unprovisioned Channel counts as a valid degraded state. Skip
  // this check and you get a process that boots cleanly, serves 200s, and answers
  // nothing.
  const status = channels.status();
  if (status.overall !== "online") {
    console.error(
      `\n  Channel is not online: ${JSON.stringify(status)}\n` +
        `  → 'setup_required' means the provider side is unfinished. Run: npm run channel:status\n` +
        `  → See docs/RUNBOOK.md\n`,
    );
    await teardown();
    process.exit(1);
  }

  const heartbeat = () => reportListenerHeartbeat(
    heartbeatConfig,
    channels.status().overall === "online",
  ).catch(() => undefined);
  await heartbeat();
  heartbeatTimer = setInterval(heartbeat, 10_000);

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, "127.0.0.1", () => {
    console.log(`\n  ✓ Channel "${process.env.CHANNEL_CODE}" online — listening on 127.0.0.1:${port}`);
    console.log(
      `    Managed Slack is mention-only. For unmentioned ambient pickup set INTERLOCK_SLACK_APP_TOKEN (xapp-) and enable Socket Mode.\n`,
    );
  });
}
