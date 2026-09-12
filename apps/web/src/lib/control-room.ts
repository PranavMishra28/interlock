import {
  approve,
  createWorkflow,
  observe,
  type Workflow,
  type WorkflowStatus,
} from "agent-core/interlock";

export type ControlRoomSnapshot = {
  asOf: number;
  source: "coordinator" | "coordinator-error" | "synthetic";
  coordinator: { connected: boolean; reason?: string; lastSeenAt?: number };
  listener: { connected: boolean; reason?: string; lastSeenAt?: number };
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

export function healthChartDomain(
  threshold: number,
  samples: { value: number }[],
) {
  return Math.max(1, threshold, ...samples.map(({ value }) => value));
}

export function healthChartY(value: number, domainMax: number) {
  return 136 - Math.min(domainMax, Math.max(0, value)) / domainMax * 112;
}

export function healthChartX(observedAt: number, start: number, end: number) {
  return start === end ? 320 : 24 + (observedAt - start) / (end - start) * 592;
}

export function executionGate(status: WorkflowStatus) {
  if (status === "RETIRED") return "Closed · verified receipt retained";
  if (status === "NEEDS_INTERVENTION") return "Blocked · operator intervention";
  if (status === "DISPATCHING") return "Claimed once · verification pending";
  if (status === "READY") return "Eligible · awaiting atomic claim";
  return "Blocked · active hold";
}

export const lifecycleReached: Record<WorkflowStatus, number> = {
  PROPOSED: 1,
  ACTIVE_HOLD: 3,
  OBSERVING: 4,
  READY: 5,
  DISPATCHING: 6,
  NEEDS_INTERVENTION: 7,
  RETIRED: 8,
};

export const lifecycleNext: Record<WorkflowStatus, string> = {
  PROPOSED: "Await configured owner",
  ACTIVE_HOLD: "Observe fresh health",
  OBSERVING: "Complete sustained window",
  READY: "Claim exact promotion",
  DISPATCHING: "Read target state",
  NEEDS_INTERVENTION: "Operator resolution",
  RETIRED: "Retain receipt",
};

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
      workflow: null,
      samples: [],
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

const workflowStatuses = new Set<WorkflowStatus>([
  "PROPOSED",
  "ACTIVE_HOLD",
  "OBSERVING",
  "READY",
  "DISPATCHING",
  "NEEDS_INTERVENTION",
  "RETIRED",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConnectivity(
  value: unknown,
): value is ControlRoomSnapshot["coordinator"] {
  return isRecord(value) &&
    typeof value.connected === "boolean" &&
    (value.reason === undefined || typeof value.reason === "string") &&
    (value.lastSeenAt === undefined || typeof value.lastSeenAt === "number");
}

function isWorkflow(value: unknown): value is Workflow {
  if (!isRecord(value) || !isRecord(value.contract) ||
      !workflowStatuses.has(value.status as WorkflowStatus)) return false;
  const contract = value.contract;
  const validContract =
    typeof contract.id === "string" &&
    typeof contract.revision === "number" &&
    typeof contract.sourceDeliveryId === "string" &&
    typeof contract.sourceMessageRef === "string" &&
    typeof contract.resourceId === "string" &&
    typeof contract.targetUrl === "string" &&
    typeof contract.candidateRevision === "string" &&
    typeof contract.ownerId === "string" &&
    typeof contract.threshold === "number" &&
    typeof contract.windowMs === "number" &&
    typeof contract.maxSampleAgeMs === "number" &&
    typeof contract.maxSampleGapMs === "number" &&
    typeof contract.proposalExpiresAt === "number";
  if (!validContract || value.observation === undefined) return validContract;
  if (!isRecord(value.observation)) return false;
  const observation = value.observation;
  return typeof observation.value === "number" &&
    typeof observation.observedAt === "number" &&
    (observation.windowStartedAt === null ||
      typeof observation.windowStartedAt === "number") &&
    Array.isArray(observation.resets) &&
    observation.resets.every((reset) =>
      isRecord(reset) &&
      typeof reset.at === "number" &&
      typeof reset.reason === "string"
    );
}

function parseSnapshot(value: unknown): ControlRoomSnapshot {
  if (!isRecord(value) ||
      typeof value.asOf !== "number" ||
      !isConnectivity(value.coordinator) ||
      !isConnectivity(value.listener) ||
      !Array.isArray(value.samples) ||
      !value.samples.every((sample) =>
        isRecord(sample) &&
        typeof sample.observedAt === "number" &&
        typeof sample.value === "number"
      ) ||
      (value.workflow !== null && !isWorkflow(value.workflow))) {
    throw new Error("Coordinator returned an invalid snapshot");
  }
  return {
    asOf: value.asOf,
    coordinator: value.coordinator,
    listener: value.listener,
    workflow: value.workflow,
    samples: value.samples,
    notice: typeof value.notice === "string" ? value.notice : undefined,
    // Only the explicit synthetic marker changes evidence semantics. Unknown
    // or omitted values fail closed to coordinator data.
    source: value.source === "synthetic" ? "synthetic" : "coordinator",
  };
}

function coordinatorFailure(error: unknown): ControlRoomSnapshot {
  return {
    asOf: Date.now(),
    source: "coordinator-error",
    coordinator: {
      connected: false,
      reason: error instanceof Error ? error.message : "Coordinator unavailable",
    },
    listener: { connected: false, reason: "Coordinator unavailable" },
    workflow: null,
    samples: [],
  };
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
    return parseSnapshot(await response.json());
  } catch (error) {
    return coordinatorFailure(error);
  }
}
