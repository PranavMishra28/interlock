import assert from "node:assert/strict";
import test from "node:test";
import type { ChannelMessage } from "@copilotkit/channels";
import { ambientSourceMessage } from "./interlock";

function message(overrides: Partial<ChannelMessage> = {}): ChannelMessage {
  return {
    text: "Hold v42 until checkout health is <= 1 for 60 seconds.",
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
    ...overrides,
  };
}

test("brand-new unmentioned top-level message and reply are accepted", () => {
  const top = ambientSourceMessage(message(), "C1::100", "C1");
  const reply = ambientSourceMessage(
    message({
      deliveryId: "Ev2",
      operation: {
        kind: "created",
        logicalMessageId: "101",
        revisionId: "101:r1",
        mentioned: false,
      },
    }),
    "C1::100",
    "C1",
  );
  assert.equal(top?.threadRef, "100");
  assert.equal(top?.deliveryId, "Ev1");
  assert.equal(reply?.threadRef, "100");
  assert.equal(reply?.logicalMessageId, "101");
});

test("channel, actor, bot, deletion, and edit provenance fail closed", () => {
  assert.equal(ambientSourceMessage(message(), "C2::100", "C1"), null);
  assert.equal(
    ambientSourceMessage(message({ actor: { id: "B1", kind: "bot" } }), "C1::100", "C1"),
    null,
  );
  assert.equal(
    ambientSourceMessage(
      message({ operation: { kind: "deleted", logicalMessageId: "100", revisionId: "100:r2", mentioned: false } }),
      "C1::100",
      "C1",
    ),
    null,
  );
  const edit = ambientSourceMessage(
    message({ operation: { kind: "updated", logicalMessageId: "100", revisionId: "100:r2", mentioned: false } }),
    "C1::100",
    "C1",
  );
  assert.equal(edit?.updated, true);
  assert.equal(edit?.revisionId, "100:r2");
});
