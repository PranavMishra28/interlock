import {
  approve,
  createWorkflow,
  observe,
  type Workflow,
} from "agent-core/interlock";

export type ControlRoomSnapshot = {
  asOf: number;
  source: "coordinator" | "synthetic";
  coordinator: { connected: boolean; reason?: string };
  listener: { connected: boolean; reason?: string };
  workflow: Workflow | null;
  samples: { observedAt: number; value: number }[];
};

export function syntheticSnapshot(): ControlRoomSnapshot {
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
  return {
    asOf: base + 56_000,
    source: "synthetic",
    coordinator: { connected: true, reason: "Fixture preview" },
    listener: { connected: false, reason: "Slack access not configured" },
    workflow,
    samples,
  };
}

export async function loadSnapshot(): Promise<ControlRoomSnapshot> {
  const url = process.env.INTERLOCK_COORDINATOR_URL;
  if (!url) return syntheticSnapshot();
  try {
    const response = await fetch(`${url}/v1/snapshot`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1_000),
    });
    if (!response.ok) throw new Error(`Coordinator returned ${response.status}`);
    return { ...(await response.json() as Omit<ControlRoomSnapshot, "source">), source: "coordinator" };
  } catch (error) {
    const snapshot = syntheticSnapshot();
    return {
      ...snapshot,
      coordinator: {
        connected: false,
        reason: error instanceof Error ? error.message : "Coordinator unavailable",
      },
    };
  }
}
