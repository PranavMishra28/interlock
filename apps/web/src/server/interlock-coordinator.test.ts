import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Contract, TrustedResource } from "agent-core/interlock";
import {
  InterlockCoordinator,
  type TargetAdapter,
  type TargetObservation,
} from "./interlock-coordinator";
import { InterlockStore } from "./interlock-store";

const trusted: TrustedResource = {
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "v42",
  ownerId: "U-OWNER",
};

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "interlock-flow-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const coordinator = new InterlockCoordinator(store, trusted);
  const base = Date.now();
  const contract: Contract = {
    id: "hold-42",
    revision: 4,
    sourceDeliveryId: "delivery-42",
    sourceMessageRef: "C-INCIDENT:1710000.0042",
    ...trusted,
    threshold: 1,
    windowMs: 1_000,
    maxSampleAgeMs: 5_000,
    maxSampleGapMs: 600,
    proposalExpiresAt: base + 60_000,
  };
  return {
    coordinator,
    store,
    contract,
    base,
    close() {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function ready(
  coordinator: InterlockCoordinator,
  contract: Contract,
  base: number,
) {
  coordinator.propose(contract, base);
  coordinator.approve(contract.id, "U-OWNER", contract.revision, base + 10);
  coordinator.observe(contract.id, 0.4, base + 100, base + 110);
  coordinator.observe(contract.id, 0.4, base + 600, base + 610);
  return coordinator.observe(contract.id, 0.4, base + 1_100, base + 1_110);
}

test("integrated hold refuses promotion, then claims once and retains receipt", async () => {
  const fixture = setup();
  try {
    const state = ready(fixture.coordinator, fixture.contract, fixture.base);
    assert.equal(state.status, "READY");
    assert.deepEqual(fixture.coordinator.requestPromotion(fixture.contract.id), {
      allowed: false,
      reason: "READY",
    });

    let promotions = 0;
    const adapter: TargetAdapter = {
      async promote(revision) {
        promotions += 1;
        assert.equal(revision, "v42");
      },
      async read(): Promise<TargetObservation> {
        return {
          revision: "v42",
          trafficPercent: 100,
          healthValue: 0.3,
          observedAt: Date.now(),
        };
      },
    };
    const retired = await fixture.coordinator.continue(
      fixture.contract.id,
      adapter,
      fixture.base + 1_120,
    );
    assert.equal(promotions, 1);
    assert.equal(retired.status, "RETIRED");
    assert.equal(retired.receipt?.expectedRevision, "v42");
  } finally {
    fixture.close();
  }
});

test("uncertain applied effect reconciles by read-back without repeating", async () => {
  const fixture = setup();
  try {
    ready(fixture.coordinator, fixture.contract, fixture.base);
    let promotions = 0;
    const adapter: TargetAdapter = {
      async promote() {
        promotions += 1;
        throw new Error("connection lost after dispatch");
      },
      async read() {
        return {
          revision: "v42",
          trafficPercent: 100,
          healthValue: 0.2,
          observedAt: Date.now(),
        };
      },
    };
    const retired = await fixture.coordinator.continue(
      fixture.contract.id,
      adapter,
      fixture.base + 1_120,
    );
    assert.equal(promotions, 1);
    assert.equal(retired.status, "RETIRED");
    assert.equal(retired.operation?.uncertain, true);
  } finally {
    fixture.close();
  }
});

test("uncertain non-effect becomes ready only after read-back", async () => {
  const fixture = setup();
  try {
    ready(fixture.coordinator, fixture.contract, fixture.base);
    const adapter: TargetAdapter = {
      async promote() {
        throw new Error("dispatch failed");
      },
      async read() {
        return {
          revision: "v41",
          trafficPercent: 100,
          healthValue: 0.2,
          observedAt: Date.now(),
        };
      },
    };
    const reconciled = await fixture.coordinator.continue(
      fixture.contract.id,
      adapter,
      fixture.base + 1_120,
    );
    assert.equal(reconciled.status, "READY");
    assert.equal(reconciled.operation, undefined);
  } finally {
    fixture.close();
  }
});

test("concurrent continuation cannot claim or dispatch twice", async () => {
  const fixture = setup();
  try {
    ready(fixture.coordinator, fixture.contract, fixture.base);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => { release = resolve; });
    let promotions = 0;
    const adapter: TargetAdapter = {
      async promote() {
        promotions += 1;
        await blocked;
      },
      async read() {
        return {
          revision: "v42",
          trafficPercent: 100,
          healthValue: 0.2,
          observedAt: Date.now(),
        };
      },
    };
    const first = fixture.coordinator.continue(
      fixture.contract.id,
      adapter,
      fixture.base + 1_120,
    );
    await assert.rejects(
      fixture.coordinator.continue(
        fixture.contract.id,
        adapter,
        fixture.base + 1_121,
      ),
      /Recovery evidence is not ready/,
    );
    release();
    assert.equal((await first).status, "RETIRED");
    assert.equal(promotions, 1);
  } finally {
    fixture.close();
  }
});

test("conflicting proposal and stale second approval fail closed", () => {
  const fixture = setup();
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    assert.equal(
      fixture.coordinator.propose(fixture.contract, fixture.base + 1).status,
      "PROPOSED",
    );
    assert.throws(
      () => fixture.coordinator.propose({
        ...fixture.contract,
        revision: fixture.contract.revision + 1,
        sourceDeliveryId: "delivery-43",
      }, fixture.base + 1),
      /immutable/,
    );
    assert.throws(
      () => fixture.coordinator.propose({
        ...fixture.contract,
        id: "hold-43",
        sourceDeliveryId: "delivery-43",
      }, fixture.base + 1),
      /already has active workflow/,
    );
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 2,
    );
    assert.throws(
      () => fixture.coordinator.approve(
        fixture.contract.id,
        "U-OWNER",
        fixture.contract.revision,
        fixture.base + 3,
      ),
      /Only a proposal can be approved/,
    );
  } finally {
    fixture.close();
  }
});
