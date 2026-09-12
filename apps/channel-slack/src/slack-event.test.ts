import assert from "node:assert/strict";
import test from "node:test";
import {
  approvalFromSlackInteraction,
  channelMessageFromSlackEvent,
  slackAppToken,
} from "./slack-event";

const envelope = {
  envelope_id: "E1",
  payload: {
    type: "event_callback",
    team_id: "T1",
    event_id: "Ev1",
    event: {
      type: "message",
      channel: "C1",
      user: "U1",
      text: "Hold the prepared checkout candidate until health stays at or below 0.5 for 10 continuous seconds, then promote that exact candidate.",
      ts: "100.1",
    },
  },
};

test("reads xapp token from any of the documented keys", () => {
  assert.equal(slackAppToken({ INTERLOCK_SLACK_APP_TOKEN: "xapp-1" }), "xapp-1");
  assert.equal(slackAppToken({ SLACK_APP_TOKEN: "xapp-2" }), "xapp-2");
  assert.equal(slackAppToken({ INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_APP_TOKEN: "xapp-3" }), "xapp-3");
  assert.equal(slackAppToken({ INTERLOCK_SLACK_APP_TOKEN: "xoxb-nope" }), "");
});

test("unmentioned top-level and reply map to the ChannelMessage ingress shape", () => {
  const top = channelMessageFromSlackEvent(envelope, "C1");
  assert.equal(top?.conversationKey, "C1::100.1");
  assert.equal(top?.message.actor.id, "U1");
  assert.equal(top?.message.operation.mentioned, false);
  assert.equal(top?.message.deliveryId, "Ev1");
  const reply = channelMessageFromSlackEvent({
    payload: {
      ...envelope.payload,
      event_id: "Ev2",
      event: { ...envelope.payload.event, ts: "101.1", thread_ts: "100.1" },
    },
  }, "C1");
  assert.equal(reply?.conversationKey, "C1::100.1");
  assert.equal(reply?.message.operation.logicalMessageId, "101.1");
});

test("bots, other channels, and deletions are dropped", () => {
  assert.equal(
    channelMessageFromSlackEvent({
      payload: { event: { ...envelope.payload.event, bot_id: "B1" } },
    }, "C1"),
    null,
  );
  assert.equal(channelMessageFromSlackEvent(envelope, "C2"), null);
  assert.equal(
    channelMessageFromSlackEvent({
      payload: { event: { ...envelope.payload.event, subtype: "message_deleted" } },
    }, "C1"),
    null,
  );
});

test("edits keep the logical id and mark updated", () => {
  const edit = channelMessageFromSlackEvent({
    payload: {
      team_id: "T1",
      event_id: "Ev3",
      event: {
        type: "message",
        channel: "C1",
        subtype: "message_changed",
        message: { user: "U1", text: "Hold v42.", ts: "100.1" },
      },
    },
  }, "C1");
  assert.equal(edit?.message.operation.kind, "updated");
  assert.equal(edit?.message.operation.logicalMessageId, "100.1");
});

test("block action parses the exact-revision approval payload", () => {
  const click = approvalFromSlackInteraction({
    payload: {
      type: "block_actions",
      team: { id: "T1" },
      user: { id: "U-OWNER" },
      channel: { id: "C1" },
      actions: [{
        action_id: "interlock_approve",
        value: JSON.stringify({
          workflowId: "hold-1",
          revision: 1,
          resourceId: "checkout",
          candidateRevision: "checkout-v42",
          cardToken: "tok",
        }),
      }],
    },
  });
  assert.equal(click?.actorId, "U-OWNER");
  assert.equal(click?.workflowId, "hold-1");
});
