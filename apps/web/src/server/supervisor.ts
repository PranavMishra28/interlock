import type { InterlockCoordinator, TargetAdapter } from "./interlock-coordinator";
import type { Workflow } from "agent-core/interlock";

const OBSERVABLE = ["ACTIVE_HOLD", "OBSERVING", "READY"];

export type SupervisorOptions = {
  coordinator: InterlockCoordinator;
  adapter: TargetAdapter;
  intervalMs?: number;
  now?: () => number;
  onError?: (error: unknown) => void;
};

export type Supervisor = {
  tick(): Promise<void>;
  start(): void;
  stop(): void;
};

function attention(workflow: Workflow) {
  return (
    OBSERVABLE.includes(workflow.status) ||
    (workflow.status === "NEEDS_INTERVENTION" && Boolean(workflow.operation))
  );
}

/**
 * Drives the hold that the coordinator only exposes as library calls: read the
 * target, record the sample, and continue once the evidence window closes.
 *
 * Authority stays in the domain. The supervisor decides only *when* to ask; it
 * never decides whether promotion is permitted, and a refused or failed step
 * leaves the persisted workflow exactly as the domain left it.
 */
export function createSupervisor(options: SupervisorOptions): Supervisor {
  const { coordinator, adapter } = options;
  const intervalMs = options.intervalMs ?? 2_000;
  const now = options.now ?? Date.now;
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  async function tick() {
    // A slow read must never overlap the next tick: two concurrent claims on
    // one workflow is exactly the duplicate-dispatch the contract forbids.
    if (running) return;
    running = true;
    try {
      const workflow = coordinator.store.list().find(attention);
      if (!workflow) return;
      const id = workflow.contract.id;

      if (workflow.status === "NEEDS_INTERVENTION") {
        await coordinator.reconcile(id, adapter);
        return;
      }

      const observed = await adapter.read();
      const recorded = coordinator.observe(
        id,
        observed.healthValue,
        observed.observedAt,
        now(),
      );
      if (recorded.status === "READY") {
        await coordinator.continue(id, adapter, now());
      }
    } catch (error) {
      options.onError?.(error);
    } finally {
      running = false;
    }
  }

  return {
    tick,
    start() {
      if (timer) return;
      timer = setInterval(() => void tick(), intervalMs);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
  };
}
