import { randomUUID } from "node:crypto";
import {
  approve,
  claim,
  createWorkflow,
  markDispatchUncertain,
  observe,
  promotionAllowed,
  resetObservation,
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

export class InterlockCoordinator {
  constructor(
    readonly store: InterlockStore,
    readonly trusted: TrustedResource,
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
    } catch {
      workflow = markDispatchUncertain(workflow);
      this.store.save(workflow, now);
      return this.reconcile(id, adapter);
    }

    let observed: TargetObservation;
    try {
      observed = await adapter.read();
    } catch {
      workflow = markDispatchUncertain(workflow);
      this.store.save(workflow);
      return workflow;
    }
    workflow = verify(workflow, observed, Date.now());
    this.store.save(workflow);
    return workflow;
  }

  async reconcile(id: string, adapter: TargetAdapter) {
    const workflow = this.required(id);
    if (
      workflow.status !== "NEEDS_INTERVENTION" ||
      !workflow.operation
    ) {
      throw new Error("Only an unresolved dispatch can be reconciled.");
    }
    let observed: TargetObservation;
    try {
      observed = await adapter.read();
    } catch {
      return workflow;
    }
    const reconciled = verify(workflow, observed, Date.now());
    this.store.save(reconciled);
    return reconciled;
  }

  private required(id: string): Workflow {
    const workflow = this.store.get(id);
    if (!workflow) throw new Error(`Unknown workflow ${id}.`);
    return workflow;
  }
}
