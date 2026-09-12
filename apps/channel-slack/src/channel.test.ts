import assert from "node:assert/strict";
import test from "node:test";
import type { ChannelMessage } from "@copilotkit/channels";
import type { SourceMessage } from "agent-core/interlock";

const requiredEnvironment = {
  CHANNEL_CODE: "test-channel",
  INTERLOCK_SLACK_WORKSPACE_ID: "T1",
  INTERLOCK_SLACK_CHANNEL_ID: "C1",
  INTERLOCK_RESOURCE_ID: "checkout",
  INTERLOCK_TARGET_URL: "https://checkout.example.test/health",
  INTERLOCK_TARGET_REVISION: "v42",
  INTERLOCK_OWNER_ID: "U-OWNER",
  INTERLOCK_COORDINATOR_URL: "http://127.0.0.1:4317",
  INTERLOCK_COORDINATOR_TOKEN: "test-token",
  OPENAI_API_KEY: "test-key",
};
Object.assign(process.env, requiredEnvironment);

const config = {
  allowedWorkspaceId: "T1",
  allowedChannelId: "C1",
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "v42",
  ownerId: "U-OWNER",
  coordinatorUrl: "http://127.0.0.1:4317",
  token: "test-token",
};

test("ambient Channel path runs the agent with validated attributed Intent input", async () => {
  const { routeAmbientMessage } = await import("./channel");
  const source: SourceMessage = {
    deliveryId: "Ev1",
    logicalMessageId: "100",
    revisionId: "100:r1",
    workspaceId: "T1",
    channelId: "C1",
    threadRef: "100",
    actorId: "U1",
    text: "Hold v42 until checkout health is <= 1 for 60 seconds.",
    updated: false,
  };
  let state: Record<string, unknown> | undefined;
  let prompt = "";
  const message = {
    text: source.text,
    user: { id: "slack:T1:U1", name: "User" },
    actor: { id: "U1", kind: "human" },
    ref: { id: "C1:100" },
    platform: "slack",
    operation: {
      kind: "created",
      logicalMessageId: "100",
      revisionId: "100:r1",
      mentioned: false,
    },
    deliveryId: "Ev1",
  } as ChannelMessage;
  await routeAmbientMessage({
    message,
    thread: {
      conversationKey: "C1::100",
      setState: async (value: Record<string, unknown>) => {
        state = value;
      },
      runAgent: async (input: { prompt?: string }) => {
        prompt = input.prompt ?? "";
        return undefined;
      },
    } as never,
  }, config, async () => source);

  assert.match(prompt, /UNTRUSTED_CONTEXT_JSON/);
  assert.match(prompt, /"deliveryId":"Ev1"/);
  assert.deepEqual(state, {
    interlockThreadRef: "100",
    interlockIntent: {
      messages: [{
        deliveryId: "Ev1",
        messageRef: "C1:100",
        actorId: "U1",
        text: source.text,
      }],
      resource: {
        resourceId: "checkout",
        targetUrl: "https://checkout.example.test/health",
        candidateRevision: "v42",
        ownerId: "U-OWNER",
      },
    },
  });
});
