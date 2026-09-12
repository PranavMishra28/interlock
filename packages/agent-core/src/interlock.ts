export type WorkflowStatus =
  | "PROPOSED"
  | "ACTIVE_HOLD"
  | "OBSERVING"
  | "READY"
  | "DISPATCHING"
  | "NEEDS_INTERVENTION"
  | "RETIRED";

export type ResetReason =
  | "unhealthy"
  | "stale"
  | "gap"
  | "clock"
  | "restart";

export type SourceMessage = {
  deliveryId: string;
  logicalMessageId: string;
  revisionId: string;
  channelId: string;
  threadRef: string;
  actorId: string;
  text: string;
  updated: boolean;
};

export type Contract = {
  id: string;
  revision: number;
  sourceDeliveryId: string;
  sourceMessageRef: string;
  resourceId: string;
  targetUrl: string;
  candidateRevision: string;
  ownerId: string;
  threshold: number;
  windowMs: number;
  maxSampleAgeMs: number;
  maxSampleGapMs: number;
  proposalExpiresAt: number;
};

export type TrustedResource = Pick<
  Contract,
  "resourceId" | "targetUrl" | "candidateRevision" | "ownerId"
>;

export type Observation = {
  value: number;
  observedAt: number;
  windowStartedAt: number | null;
  resets: { at: number; reason: ResetReason }[];
};

export type Workflow = {
  contract: Contract;
  status: WorkflowStatus;
  approval?: { actorId: string; revision: number; approvedAt: number };
  observation?: Observation;
  operation?: { id: string; claimedAt: number; uncertain: boolean };
  receipt?: {
    operationId: string;
    expectedRevision: string;
    observedRevision: string;
    trafficPercent: number;
    healthValue: number;
    verifiedAt: number;
  };
};

export class InterlockError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function assert(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) throw new InterlockError(code, message);
}

function matchesTrusted(contract: Contract, trusted: TrustedResource) {
  return (
    contract.resourceId === trusted.resourceId &&
    contract.targetUrl === trusted.targetUrl &&
    contract.candidateRevision === trusted.candidateRevision &&
    contract.ownerId === trusted.ownerId
  );
}

export function createWorkflow(
  contract: Contract,
  trusted: TrustedResource,
): Workflow {
  assert(matchesTrusted(contract, trusted), "UNTRUSTED_RESOURCE", "Contract does not exactly match trusted configuration.");
  assert(contract.revision > 0, "INVALID_REVISION", "Contract revision must be positive.");
  assert(contract.windowMs > 0, "INVALID_WINDOW", "Recovery window must be positive.");
  assert(contract.maxSampleAgeMs > 0 && contract.maxSampleGapMs > 0, "INVALID_FRESHNESS", "Freshness limits must be positive.");
  assert(contract.sourceDeliveryId && contract.sourceMessageRef, "MISSING_SOURCE", "Attributed source identity is required.");
  return { contract: structuredClone(contract), status: "PROPOSED" };
}

export function approve(
  workflow: Workflow,
  actorId: string,
  revision: number,
  now: number,
): Workflow {
  assert(workflow.status === "PROPOSED", "NOT_PROPOSED", "Only a proposal can be approved.");
  assert(now <= workflow.contract.proposalExpiresAt, "PROPOSAL_EXPIRED", "Expired proposal cannot create a hold.");
  assert(actorId === workflow.contract.ownerId, "UNAUTHORIZED", "Only the trusted configured owner may approve.");
  assert(revision === workflow.contract.revision, "STALE_APPROVAL", "Approval must bind the exact proposal revision.");
  return {
    ...workflow,
    status: "ACTIVE_HOLD",
    approval: { actorId, revision, approvedAt: now },
  };
}

export function resetObservation(
  workflow: Workflow,
  reason: ResetReason,
  at: number,
): Workflow {
  assert(workflow.status !== "PROPOSED" && workflow.status !== "RETIRED", "NO_ACTIVE_HOLD", "No active hold can be reset.");
  return {
    ...workflow,
    status: "ACTIVE_HOLD",
    observation: workflow.observation
      ? {
          ...workflow.observation,
          windowStartedAt: null,
          resets: [...workflow.observation.resets, { at, reason }],
        }
      : { value: Number.NaN, observedAt: at, windowStartedAt: null, resets: [{ at, reason }] },
  };
}

export function observe(
  workflow: Workflow,
  value: number,
  observedAt: number,
  now: number,
): Workflow {
  assert(["ACTIVE_HOLD", "OBSERVING", "READY"].includes(workflow.status), "NO_ACTIVE_HOLD", "Observation requires an active hold.");

  const prior = workflow.observation;
  const reason: ResetReason | undefined =
    observedAt > now || (prior && observedAt <= prior.observedAt)
      ? "clock"
      : now - observedAt > workflow.contract.maxSampleAgeMs
        ? "stale"
        : prior && observedAt - prior.observedAt > workflow.contract.maxSampleGapMs
          ? "gap"
          : value > workflow.contract.threshold
            ? "unhealthy"
            : undefined;
  const resets = reason
    ? [...(prior?.resets ?? []), { at: now, reason }]
    : (prior?.resets ?? []);

  if (reason === "stale" || reason === "clock" || reason === "unhealthy") {
    return {
      ...workflow,
      status: "ACTIVE_HOLD",
      observation: { value, observedAt, windowStartedAt: null, resets },
    };
  }

  const windowStartedAt =
    reason === "gap" || prior?.windowStartedAt == null
      ? observedAt
      : prior.windowStartedAt;
  const status =
    observedAt - windowStartedAt >= workflow.contract.windowMs
      ? "READY"
      : "OBSERVING";
  return {
    ...workflow,
    status,
    observation: { value, observedAt, windowStartedAt, resets },
  };
}

export function promotionAllowed(workflow: Workflow) {
  return workflow.status === "RETIRED";
}

export function claim(
  workflow: Workflow,
  trusted: TrustedResource,
  operationId: string,
  now: number,
): Workflow {
  assert(workflow.status === "READY", "NOT_READY", "Recovery evidence is not ready.");
  assert(matchesTrusted(workflow.contract, trusted), "UNTRUSTED_RESOURCE", "Trusted resource changed before claim.");
  assert(workflow.approval?.actorId === trusted.ownerId, "UNAUTHORIZED", "Trusted owner approval is missing.");
  assert(workflow.approval.revision === workflow.contract.revision, "STALE_APPROVAL", "Approval revision changed before claim.");
  assert(!workflow.operation, "DUPLICATE_CLAIM", "Operation was already claimed.");
  assert(workflow.observation && now - workflow.observation.observedAt <= workflow.contract.maxSampleAgeMs, "STALE_EVIDENCE", "Fresh evidence is required at claim.");
  return {
    ...workflow,
    status: "DISPATCHING",
    operation: { id: operationId, claimedAt: now, uncertain: false },
  };
}

export function markDispatchUncertain(workflow: Workflow): Workflow {
  assert(workflow.status === "DISPATCHING" && workflow.operation, "NO_OPERATION", "No dispatch can be marked uncertain.");
  return {
    ...workflow,
    status: "NEEDS_INTERVENTION",
    operation: { ...workflow.operation, uncertain: true },
  };
}

export function reconcileNotApplied(workflow: Workflow): Workflow {
  assert(workflow.status === "NEEDS_INTERVENTION" && workflow.operation?.uncertain, "NOT_UNCERTAIN", "Only an uncertain dispatch can be reconciled.");
  return { ...workflow, status: "READY", operation: undefined };
}

export function verify(
  workflow: Workflow,
  observed: {
    revision: string;
    trafficPercent: number;
    healthValue: number;
    observedAt: number;
  },
  now: number,
): Workflow {
  assert(
    (workflow.status === "DISPATCHING" ||
      (workflow.status === "NEEDS_INTERVENTION" &&
        workflow.operation?.uncertain)) &&
      workflow.operation,
    "NO_OPERATION",
    "No claimed operation can be verified.",
  );
  const matches =
    observed.revision === workflow.contract.candidateRevision &&
    observed.trafficPercent === 100 &&
    observed.healthValue <= workflow.contract.threshold &&
    now - observed.observedAt <= workflow.contract.maxSampleAgeMs;
  if (!matches) return { ...workflow, status: "NEEDS_INTERVENTION" };
  return {
    ...workflow,
    status: "RETIRED",
    receipt: {
      operationId: workflow.operation.id,
      expectedRevision: workflow.contract.candidateRevision,
      observedRevision: observed.revision,
      trafficPercent: observed.trafficPercent,
      healthValue: observed.healthValue,
      verifiedAt: now,
    },
  };
}
