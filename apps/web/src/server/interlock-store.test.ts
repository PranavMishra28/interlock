import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  approve,
  claim,
  createWorkflow,
  observe,
  type Contract,
  type TrustedResource,
} from "agent-core/interlock";
import { InterlockStore } from "./interlock-store";

const trusted: TrustedResource = {
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "v42",
  ownerId: "U-OWNER",
};
const contract: Contract = {
  id: "hold-42",
  revision: 1,
  sourceDeliveryId: "delivery-1",
  sourceMessageRef: "C-INCIDENT:1710000.0001",
  ...trusted,
  threshold: 1,
  windowMs: 1_000,
  maxSampleAgeMs: 250,
  maxSampleGapMs: 600,
  proposalExpiresAt: 10_000,
};

test("one store owns the database and deliveries deduplicate", () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-store-"));
  const path = join(dir, "state.db");
  const store = new InterlockStore(path);
  try {
    assert.throws(() => new InterlockStore(path), /already owned/);
    assert.equal(store.recordDelivery("delivery-1"), true);
    assert.equal(store.recordDelivery("delivery-1"), false);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("bounded source context deduplicates delivery and preserves edits", () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-source-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const source = {
    deliveryId: "Ev1",
    logicalMessageId: "100",
    revisionId: "100:r1",
    channelId: "C1",
    threadRef: "100",
    actorId: "U1",
    text: "Hold v42.",
    updated: false,
  };
  try {
    assert.equal(store.ingestSource(source), true);
    assert.equal(store.ingestSource(source), false);
    assert.equal(store.ingestSource({
      ...source,
      deliveryId: "Ev2",
      revisionId: "100:r2",
      text: "Hold v42 after checkout stays healthy.",
      updated: true,
    }), true);
    assert.deepEqual(store.sourceContext("100"), [{
      ...source,
      deliveryId: "Ev2",
      revisionId: "100:r2",
      text: "Hold v42 after checkout stays healthy.",
      updated: true,
    }]);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("restart resets observation windows and preserves active holds", () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-restart-"));
  const path = join(dir, "state.db");
  let workflow = approve(createWorkflow(contract, trusted), "U-OWNER", 1, 100);
  workflow = observe(workflow, 0.3, 1_000, 1_010);
  const first = new InterlockStore(path);
  first.save(workflow);
  first.close();

  const reopened = new InterlockStore(path);
  try {
    const recovered = reopened.get(contract.id);
    assert.equal(recovered?.status, "ACTIVE_HOLD");
    assert.equal(recovered?.observation?.windowStartedAt, null);
    assert.equal(recovered?.observation?.resets.at(-1)?.reason, "restart");
  } finally {
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("restart converts an in-flight dispatch to uncertain intervention", () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-uncertain-"));
  const path = join(dir, "state.db");
  let workflow = approve(createWorkflow(contract, trusted), "U-OWNER", 1, 100);
  workflow = observe(workflow, 0.3, 1_000, 1_010);
  workflow = observe(workflow, 0.3, 1_500, 1_510);
  workflow = observe(workflow, 0.3, 2_000, 2_010);
  workflow = claim(workflow, trusted, "op-1", 2_020);
  const first = new InterlockStore(path);
  first.save(workflow);
  first.close();

  const reopened = new InterlockStore(path);
  try {
    const recovered = reopened.get(contract.id);
    assert.equal(recovered?.status, "NEEDS_INTERVENTION");
    assert.equal(recovered?.operation?.uncertain, true);
  } finally {
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
