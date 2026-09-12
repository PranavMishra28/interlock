import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DemoTarget, DEMO_TRUSTED, seedDemo } from "./demo";
import { InterlockCoordinator } from "./interlock-coordinator";
import { InterlockStore } from "./interlock-store";

test("demo seeds one approved persistent contract and enforces its revision", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-demo-"));
  const path = join(dir, "demo.db");
  let store = new InterlockStore(path);
  try {
    const coordinator = new InterlockCoordinator(store, DEMO_TRUSTED);
    const beats: string[] = [];
    const seeded = seedDemo(store, coordinator, 1_000, (beat) => beats.push(beat));
    assert.equal(seeded.status, "ACTIVE_HOLD");
    assert.equal(seeded.contract.threshold, 0.5);
    assert.equal(seeded.contract.windowMs, 6_000);
    assert.match(seeded.contract.sourceMessageRef, /synthetic/i);
    assert.deepEqual(beats, [
      "Intent + scope: synthetic message proposed checkout v42.",
      "Authority refused: wrong actor cannot approve.",
      "Authority refused: owner cannot approve the wrong revision.",
      "Authority accepted: configured owner approved exact revision 1.",
    ]);
    assert.deepEqual(coordinator.requestPromotion(seeded.contract.id), {
      allowed: false,
      reason: "ACTIVE_HOLD",
    });
    assert.equal(seedDemo(store, coordinator, 2_000).contract.id, seeded.contract.id);
    assert.equal(store.list().length, 1);

    store.close();
    store = new InterlockStore(path);
    const recovered = store.get(seeded.contract.id);
    assert.equal(recovered?.status, "ACTIVE_HOLD");
    assert.equal(recovered?.observation?.resets.at(-1)?.reason, "restart");

    const target = new DemoTarget();
    await assert.rejects(target.promote("v99"), /outside the allowlist/);
    await target.promote("v42");
    assert.equal(target.dispatches, 1);
    assert.equal((await target.read()).revision, "v42");
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
