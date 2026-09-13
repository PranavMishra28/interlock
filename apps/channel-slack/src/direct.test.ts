import assert from "node:assert/strict";
import test from "node:test";
import { handleSocketEnvelope } from "./direct";
import type { SourceMessage } from "agent-core/interlock";

const config = {
  allowedWorkspaceId: "T1",
  allowedChannelId: "C1",
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "checkout-v42",
  ownerId: "U-OWNER",
  coordinatorUrl: "http://127.0.0.1:9",
  token: "tok",
  botToken: "xoxb-test",
};

const source: SourceMessage = {
  deliveryId: "Ev1",
  logicalMessageId: "100.1",
  revisionId: "100.1:Ev1",
  workspaceId: "T1",
  channelId: "C1",
  threadRef: "100.1",
  actorId: "U1",
  text: "Hold checkout-v42 until health stays at or below 0.5 for 10 seconds.",
  updated: false,
};

test("Socket Mode message becomes a coordinator proposal and Slack card", async () => {
  const calls: string[] = [];
  const prior = { ...source, deliveryId: "Ev0", logicalMessageId: "99.1", actorId: "U-JUNIOR", text: "Checkout is stable now." };
  const result = await handleSocketEnvelope({
    payload: {
      type: "event_callback",
      team_id: "T1",
      event_id: "Ev1",
      event: {
        type: "message",
        channel: "C1",
        user: "U1",
        text: source.text,
        ts: "100.1",
      },
    },
  }, config, {
    ingress: async () => [prior, source],
    model: async (prompt) => {
      assert.match(prompt, /"actorId":"U-JUNIOR"/);
      assert.match(prompt, /Checkout is stable now/);
      return ({
      kind: "proposal",
      resourceId: "checkout",
      targetUrl: config.targetUrl,
      candidateRevision: "checkout-v42",
      threshold: 0.5,
      windowMs: 10_000,
      sourceDeliveryIds: ["Ev1"],
      });
    },
    request: async (url, init) => {
      calls.push(`${init?.method} ${url}`);
      if (String(url).endsWith("/v1/slack/proposals")) {
        return new Response(JSON.stringify({
          workflowId: "hold-1",
          revision: 1,
          resourceId: "checkout",
          candidateRevision: "checkout-v42",
          cardToken: "card",
          condition: "Health must remain at or below 0.5 for 10 seconds.",
        }), { status: 201 });
      }
      assert.match(String(init?.body), /<@U-OWNER>.*Hold checkout-v42/);
      assert.match(String(init?.body), /Yes — approve checkout-v42/);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.equal(result, "proposed");
  assert.deepEqual(calls, [
    "POST http://127.0.0.1:9/v1/slack/proposals",
    "POST https://slack.com/api/chat.postMessage",
  ]);
});

test("Socket Mode approval click hits the coordinator and acknowledges in Slack", async () => {
  const calls: string[] = [];
  const result = await handleSocketEnvelope({
    payload: {
      type: "block_actions",
      team: { id: "T1" },
      user: { id: "U-OWNER" },
      channel: { id: "C1" },
      container: { message_ts: "101.1" },
      message: { thread_ts: "100.1" },
      actions: [{
        action_id: "interlock_approve",
        value: JSON.stringify({
          workflowId: "hold-1",
          revision: 1,
          resourceId: "checkout",
          candidateRevision: "checkout-v42",
          cardToken: "card",
        }),
      }],
    },
  }, config, {
    request: async (url, init) => {
      calls.push(String(url));
      if (String(url).includes("chat.update")) {
        assert.match(String(init?.body), /U-OWNER.*approved.*checkout-v42/);
        assert.match(String(init?.body), /"ts":"101.1"/);
      }
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(result, "approved");
  assert.deepEqual(calls, [
    "http://127.0.0.1:9/v1/slack/approve",
    "https://slack.com/api/chat.update",
  ]);
});
