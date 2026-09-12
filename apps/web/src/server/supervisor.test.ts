import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Contract, TrustedResource } from "agent-core/interlock";
import {
  InterlockCoordinator,
  type TargetObservation,
} from "./interlock-coordinator";
import { InterlockStore } from "./interlock-store";
import { createSupervisor } from "./supervisor";

const trusted: TrustedResource = {
  resourceId: "checkout",
  targetUrl: "https://checkout.example.test/health",
  candidateRevision: "v42",
  ownerId: "U-OWNER",
};

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "interlock-supervisor-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const coordinator = new InterlockCoordinator(store, trusted);
  // The simulated clock starts behind real time so that samples stay in the
  // past. Read-back freshness is deliberately verified against the true wall
  // clock rather than the tick's start time, because a promotion can take
  // twenty seconds and staleness must be measured when the read returns.
  const base = Date.now() - 10_000;
  const contract: Contract = {
    id: "hold-supervisor",
    revision: 4,
    sourceDeliveryId: "delivery-supervisor",
    sourceMessageRef: "C-INCIDENT:1710000.0042",
    ...trusted,
    threshold: 1,
    windowMs: 1_000,
    maxSampleAgeMs: 30_000,
    maxSampleGapMs: 5_000,
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

/** A target whose health and clock the test drives directly. */
function target(base: number) {
  const state = {
    health: 0.4,
    promotions: [] as string[],
    trafficRevision: "v41",
    failRead: false,
    offset: 0,
  };
  let clock = base;
  return {
    state,
    advance(ms: number) {
      clock += ms;
      return clock;
    },
    now: () => clock,
    adapter: {
      async promote(revision: string) {
        state.promotions.push(revision);
        state.trafficRevision = revision;
      },
      async read(): Promise<TargetObservation> {
        if (state.failRead) throw new Error("target unreachable");
        return {
          revision: state.trafficRevision,
          trafficPercent: 100,
          healthValue: state.health,
          observedAt: clock + state.offset,
        };
      },
    },
  };
}

test("supervisor observes an approved hold and promotes exactly once", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 10,
    );
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: driver.adapter,
      now: () => driver.now(),
    });

    driver.advance(100);
    await supervisor.tick();
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "OBSERVING");
    assert.equal(driver.state.promotions.length, 0);

    // The window has not elapsed yet, so nothing may be claimed.
    driver.advance(500);
    await supervisor.tick();
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "OBSERVING");
    assert.equal(driver.state.promotions.length, 0);

    driver.advance(600);
    await supervisor.tick();
    const retired = fixture.store.get(fixture.contract.id);
    assert.equal(retired?.status, "RETIRED");
    assert.deepEqual(driver.state.promotions, ["v42"]);
    assert.equal(retired?.receipt?.observedRevision, "v42");

    // A retired workflow is terminal: further ticks must not promote again.
    driver.advance(600);
    await supervisor.tick();
    assert.deepEqual(driver.state.promotions, ["v42"]);
  } finally {
    fixture.close();
  }
});

test("an unhealthy sample restarts the window instead of promoting", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 10,
    );
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: driver.adapter,
      now: () => driver.now(),
    });

    driver.advance(100);
    await supervisor.tick();

    driver.state.health = 9;
    driver.advance(500);
    await supervisor.tick();
    const held = fixture.store.get(fixture.contract.id);
    assert.equal(held?.status, "ACTIVE_HOLD");
    assert.equal(held?.observation?.windowStartedAt, null);
    assert.equal(held?.observation?.resets.at(-1)?.reason, "unhealthy");

    // Recovery must serve a full fresh window, not the time already banked.
    driver.state.health = 0.4;
    driver.advance(500);
    await supervisor.tick();
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "OBSERVING");
    assert.equal(driver.state.promotions.length, 0);

    driver.advance(1_100);
    await supervisor.tick();
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "RETIRED");
    assert.deepEqual(driver.state.promotions, ["v42"]);
  } finally {
    fixture.close();
  }
});

test("a read slower than the interval does not reset the window", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  // Long enough that the hold cannot close during the test: this asserts the
  // window survives, not that it completes.
  const contract = { ...fixture.contract, windowMs: 60_000 };
  let localNow = fixture.base;
  try {
    fixture.coordinator.propose(contract, fixture.base);
    fixture.coordinator.approve(
      contract.id,
      "U-OWNER",
      contract.revision,
      fixture.base + 10,
    );

    let openGate: (() => void) | undefined;
    let gate: Promise<void> | undefined;
    const adapter = {
      promote: (revision: string) => driver.adapter.promote(revision),
      async read() {
        if (gate) await gate;
        return driver.adapter.read();
      },
    };
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter,
      intervalMs: 500,
      now: () => localNow,
    });

    driver.advance(100);
    localNow += 100;
    await supervisor.tick();
    const started = fixture.store.get(contract.id)?.observation?.localWindowStartedAt;
    assert.equal(started, localNow);

    // A read begins that will outlast several polling intervals.
    gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    driver.advance(100);
    localNow += 100;
    const inFlight = supervisor.tick();

    // The scheduler keeps firing on time. These fires find the read in progress
    // and return early, but their arrival is what proves the machine is awake.
    for (let index = 0; index < 4; index += 1) {
      localNow += 500;
      await supervisor.tick();
    }
    openGate?.();
    await inFlight;

    driver.advance(500);
    localNow += 500;
    await supervisor.tick();

    const held = fixture.store.get(contract.id);
    assert.equal(held?.observation?.localWindowStartedAt, started);
    assert.equal(
      held?.observation?.resets.some((reset) => reset.reason === "gap"),
      false,
    );
  } finally {
    fixture.close();
  }
});

test("a local polling suspension resets a target-contiguous window", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  let localNow = fixture.base;
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 10,
    );
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: driver.adapter,
      intervalMs: 500,
      now: () => localNow,
    });

    driver.advance(100);
    localNow += 100;
    await supervisor.tick();

    // The target remains inside its configured 5s sample gap, but the local
    // scheduler missed a complete polling opportunity.
    driver.advance(1_000);
    localNow += 1_500;
    await supervisor.tick();

    const held = fixture.store.get(fixture.contract.id);
    assert.equal(held?.status, "OBSERVING");
    assert.equal(held?.observation?.resets.at(-1)?.reason, "gap");
    assert.equal(held?.observation?.windowStartedAt, driver.now());
    assert.equal(held?.observation?.localWindowStartedAt, localNow);
    assert.deepEqual(driver.state.promotions, []);
  } finally {
    fixture.close();
  }
});

test("a failed read is reported and never advances the hold", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  const errors: unknown[] = [];
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 10,
    );
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: driver.adapter,
      now: () => driver.now(),
      onError: (error) => errors.push(error),
    });

    driver.state.failRead = true;
    driver.advance(100);
    await supervisor.tick();
    assert.equal(errors.length, 1);
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "ACTIVE_HOLD");
    assert.equal(driver.state.promotions.length, 0);
  } finally {
    fixture.close();
  }
});

test("an unapproved proposal is never observed", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  const errors: unknown[] = [];
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: driver.adapter,
      now: () => driver.now(),
      onError: (error) => errors.push(error),
    });

    driver.advance(2_000);
    await supervisor.tick();
    await supervisor.tick();
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "PROPOSED");
    assert.equal(driver.state.promotions.length, 0);
    assert.deepEqual(errors, []);
  } finally {
    fixture.close();
  }
});

test("overlapping ticks cannot claim the same workflow twice", async () => {
  const fixture = setup();
  const driver = target(fixture.base);
  try {
    fixture.coordinator.propose(fixture.contract, fixture.base);
    fixture.coordinator.approve(
      fixture.contract.id,
      "U-OWNER",
      fixture.contract.revision,
      fixture.base + 10,
    );
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let reads = 0;
    const supervisor = createSupervisor({
      coordinator: fixture.coordinator,
      adapter: {
        promote: driver.adapter.promote,
        async read() {
          reads += 1;
          if (reads === 2) await gate;
          return driver.adapter.read();
        },
      },
      now: () => driver.now(),
    });

    driver.advance(100);
    await supervisor.tick();

    driver.advance(1_100);
    const slow = supervisor.tick();
    // Fires while the first tick is still awaiting its read.
    await supervisor.tick();
    release();
    await slow;

    assert.deepEqual(driver.state.promotions, ["v42"]);
    assert.equal(fixture.store.get(fixture.contract.id)?.status, "RETIRED");
  } finally {
    fixture.close();
  }
});
