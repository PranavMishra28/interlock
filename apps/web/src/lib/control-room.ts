import {
  approve,
  createWorkflow,
  observe,
  type Workflow,
  type WorkflowStatus,
} from "agent-core/interlock";

export type ControlRoomSnapshot = {
  asOf: number;
  source: "coordinator" | "synthetic";
  coordinator: { connected: boolean; reason?: string };
  listener: { connected: boolean; reason?: string };
  workflow: Workflow | null;
  samples: { observedAt: number; value: number }[];
  notice?: string;
};

export type FixtureState =
  | "observing"
  | "empty"
  | "awaiting-owner"
  | "coordinator-offline"
  | "stale"
  | "gap"
  | "unauthorized"
  | "intervention"
  | "retired";

export const fixtureStates: FixtureState[] = [
  "observing",
  "empty",
  "awaiting-owner",
  "coordinator-offline",
  "stale",
  "gap",
  "unauthorized",
  "intervention",
  "retired",
];

export function healthChartY(value: number) {
  return 136 - Math.min(2.2, Math.max(0, value)) / 2.2 * 112;
}

export function executionGate(status: WorkflowStatus) {
  if (status === "RETIRED") return "Closed · verified receipt retained";
  if (status === "NEEDS_INTERVENTION") return "Blocked · operator intervention";
  if (status === "DISPATCHING") return "Claimed once · verification pending";
  if (status === "READY") return "Eligible · awaiting atomic claim";
  return "Blocked · active hold";
}

/**
 * Copy for the no-contract case. An unreachable coordinator must never be
 * reported as an absence of decisions: the page cannot tell the difference, and
 * claiming it can is the one thing the Control Room must not do.
 */
export function emptyState(coordinator: { connected: boolean; reason?: string }) {
  if (coordinator.connected) {
    return {
      title: "No active contract",
      body: "The coordinator is connected and has no unresolved workflow.",
    };
  }
  return {
    title: "Coordinator unavailable",
    body:
      "This page cannot show decision state, and the absence of a contract here " +
      "is not evidence that none exists." +
      (coordinator.reason ? ` Reported: ${coordinator.reason}.` : ""),
  };
}

export function syntheticSnapshot(
  fixture: FixtureState = "observing",
): ControlRoomSnapshot {
  const base = Date.UTC(2026, 8, 12, 17, 25);
  const trusted = {
    resourceId: "checkout",
    targetUrl: "https://checkout.example.test/health",
    candidateRevision: "v42",
    ownerId: "U-OWNER",
  };
  let workflow = createWorkflow(
    {
      id: "hold-42",
      revision: 3,
      sourceDeliveryId: "synthetic-delivery-1",
      sourceMessageRef: "#inc-checkout · 10:24:12",
      ...trusted,
      threshold: 1,
      windowMs: 60_000,
      maxSampleAgeMs: 15_000,
      maxSampleGapMs: 20_000,
      proposalExpiresAt: base + 300_000,
    },
    trusted,
  );
  workflow = approve(workflow, "U-OWNER", 3, base + 1_000);
  const samples = [
    { observedAt: base + 10_000, value: 1.8 },
    { observedAt: base + 25_000, value: 0.82 },
    { observedAt: base + 40_000, value: 0.71 },
    { observedAt: base + 55_000, value: 0.64 },
  ];
  for (const sample of samples) {
    workflow = observe(workflow, sample.value, sample.observedAt, sample.observedAt + 1_000);
  }
  const snapshot: ControlRoomSnapshot = {
    asOf: base + 56_000,
    source: "synthetic",
    coordinator: { connected: true, reason: "Fixture preview" },
    listener: { connected: false, reason: "Slack access not configured" },
    workflow,
    samples,
  };
  if (fixture === "empty") return { ...snapshot, workflow: null, samples: [] };
  if (fixture === "awaiting-owner") {
    return {
      ...snapshot,
      workflow: createWorkflow(workflow.contract, trusted),
      samples: [],
    };
  }
  if (fixture === "coordinator-offline") {
    return {
      ...snapshot,
      coordinator: { connected: false, reason: "Connection refused" },
    };
  }
  if (fixture === "stale" || fixture === "gap") {
    return {
      ...snapshot,
      workflow: {
        ...workflow,
        status: "ACTIVE_HOLD",
        observation: {
          ...workflow.observation!,
          windowStartedAt: null,
          resets: [
            ...workflow.observation!.resets,
            { at: base + 56_000, reason: fixture },
          ],
        },
      },
    };
  }
  if (fixture === "unauthorized") {
    return {
      ...snapshot,
      workflow: createWorkflow(workflow.contract, trusted),
      samples: [],
      notice: "Unauthorized interaction rejected. Awaiting the configured owner.",
    };
  }
  if (fixture === "intervention") {
    return {
      ...snapshot,
      workflow: {
        ...workflow,
        status: "NEEDS_INTERVENTION",
        operation: {
          id: "op-mismatch-42",
          claimedAt: base + 56_000,
          uncertain: false,
        },
        verification: {
          observedRevision: "v41",
          trafficPercent: 100,
          healthValue: 0.42,
          observedAt: base + 56_000,
          verifiedAt: base + 57_000,
        },
      },
      notice: "Verification mismatch: expected v42; observed v41.",
    };
  }
  if (fixture === "retired") {
    return {
      ...snapshot,
      workflow: {
        ...workflow,
        status: "RETIRED",
        operation: {
          id: "op-42",
          claimedAt: base + 56_000,
          uncertain: false,
        },
        receipt: {
          operationId: "op-42",
          expectedRevision: "v42",
          observedRevision: "v42",
          trafficPercent: 100,
          healthValue: 0.42,
          verifiedAt: base + 58_000,
        },
      },
    };
  }
  return snapshot;
}

export async function loadSnapshot(
  fixture: FixtureState = "observing",
): Promise<ControlRoomSnapshot> {
  const url = process.env.INTERLOCK_COORDINATOR_URL;
  if (!url) return syntheticSnapshot(fixture);
  try {
    const response = await fetch(`${url}/v1/snapshot`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1_000),
    });
    if (!response.ok) throw new Error(`Coordinator returned ${response.status}`);
    const snapshot = await response.json() as ControlRoomSnapshot;
    return {
      ...snapshot,
      // Only the explicit synthetic marker changes evidence semantics. Unknown
      // or omitted values fail closed to coordinator data.
      source: snapshot.source === "synthetic" ? "synthetic" : "coordinator",
    };
  } catch (error) {
    return {
      asOf: Date.now(),
      source: "coordinator",
      coordinator: {
        connected: false,
        reason: error instanceof Error ? error.message : "Coordinator unavailable",
      },
      listener: { connected: false, reason: "Coordinator unavailable" },
      workflow: null,
      samples: [],
    };
  }
}
