import { randomUUID } from "node:crypto";
import {
  approve,
  claim,
  createWorkflow,
  markDispatchUncertain,
  observe,
  promotionAllowed,
  resetObservation,
  VERIFICATION_PROPAGATION_DEADLINE_MS,
  verify,
  type Contract,
  type TrustedResource,
  type Workflow,
} from "agent-core/interlock";
import { InterlockStore } from "./interlock-store";

export type TargetObservation = {
  revision: string;
  trafficPercent: number;
  healthValue: number;
  observedAt: number;
};

export type TargetAdapter = {
  promote(revision: string, operationId: string): Promise<void>;
  read(): Promise<TargetObservation>;
};

const VERIFICATION_POLL_INTERVAL_MS = 1_000;

export class InterlockCoordinator {
  constructor(
    readonly store: InterlockStore,
    readonly trusted: TrustedResource,
    private readonly clock: () => number = Date.now,
    private readonly pause: (ms: number) => Promise<void> =
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}

  propose(contract: Contract, now = Date.now()) {
    const existing = this.store.get(contract.id);
    if (existing) {
      if (
        existing.contract.sourceDeliveryId === contract.sourceDeliveryId &&
        JSON.stringify(existing.contract) === JSON.stringify(contract)
      ) {
        return existing;
      }
      throw new Error(`Workflow ${contract.id} is immutable; create a new revision.`);
    }
    const conflict = this.store.list().find(
      (workflow) =>
        workflow.contract.id !== contract.id &&
        workflow.contract.resourceId === contract.resourceId &&
        workflow.status !== "RETIRED" &&
        !(
          workflow.status === "PROPOSED" &&
          now > workflow.contract.proposalExpiresAt
        ),
    );
    if (conflict) {
      throw new Error(
        `Resource ${contract.resourceId} already has active workflow ${conflict.contract.id}.`,
      );
    }
    const workflow = createWorkflow(contract, this.trusted);
    if (!this.store.createFromDelivery(workflow, now)) {
      throw new Error("Duplicate delivery has no matching persisted workflow.");
    }
    return workflow;
  }

  approve(id: string, actorId: string, revision: number, now = Date.now()) {
    const workflow = approve(this.required(id), actorId, revision, now);
    this.store.save(workflow, now);
    return workflow;
  }

  observe(id: string, value: number, observedAt: number, now = Date.now()) {
    const workflow = observe(this.required(id), value, observedAt, now);
    this.store.saveObservation(workflow, value, observedAt, now);
    return workflow;
  }

  resetObservation(id: string, now = Date.now()) {
    const workflow = resetObservation(this.required(id), "gap", now);
    this.store.save(workflow, now);
    return workflow;
  }

  requestPromotion(id: string) {
    const workflow = this.required(id);
    return promotionAllowed(workflow)
      ? { allowed: true as const }
      : { allowed: false as const, reason: workflow.status };
  }

  async continue(id: string, adapter: TargetAdapter, now = Date.now()) {
    const current = this.required(id);
    if (
      current.status === "NEEDS_INTERVENTION" &&
      current.operation
    ) {
      return this.reconcile(id, adapter);
    }
    let workflow = claim(
      current,
      this.trusted,
      randomUUID(),
      now,
    );
    this.store.save(workflow, now);
    try {
      await adapter.promote(
        workflow.contract.candidateRevision,
        workflow.operation!.id,
      );
    } catch (error) {
      // Read-back still decides the outcome, but an operator staring at
      // NEEDS_INTERVENTION cannot tell a refused dispatch from a slow one.
      console.error(
        `  interlock dispatch failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      workflow = markDispatchUncertain(workflow);
      this.store.save(workflow, now);
      return this.verifyUntilSettled(workflow, adapter);
    }

    return this.verifyUntilSettled(workflow, adapter);
  }

  async reconcile(id: string, adapter: TargetAdapter) {
    const workflow = this.required(id);
    if (
      workflow.status !== "NEEDS_INTERVENTION" ||
      !workflow.operation
    ) {
      throw new Error("Only an unresolved dispatch can be reconciled.");
    }
    return this.verifyUntilSettled(workflow, adapter);
  }

  private async verifyUntilSettled(
    initial: Workflow,
    adapter: TargetAdapter,
  ) {
    const deadline = this.clock() + VERIFICATION_PROPAGATION_DEADLINE_MS;
    let workflow = initial;
    while (true) {
      let observed: TargetObservation | undefined;
      try {
        observed = await adapter.read();
      } catch {
        if (workflow.status === "DISPATCHING") {
          workflow = markDispatchUncertain(workflow);
          this.store.save(workflow, this.clock());
        }
      }
      if (observed) {
        const now = this.clock();
        if (now <= deadline) {
          workflow = verify(workflow, observed, now);
          this.store.save(workflow, now);
          if (workflow.status === "RETIRED") return workflow;
        } else if (workflow.status === "DISPATCHING") {
          workflow = markDispatchUncertain(workflow);
          this.store.save(workflow, now);
        }
      }
      const remaining = deadline - this.clock();
      if (remaining <= 0) return workflow;
      await this.pause(Math.min(VERIFICATION_POLL_INTERVAL_MS, remaining));
    }
  }

  private required(id: string): Workflow {
    const workflow = this.store.get(id);
    if (!workflow) throw new Error(`Unknown workflow ${id}.`);
    return workflow;
  }
}
