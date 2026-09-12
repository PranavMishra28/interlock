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
  let lastTickAt: number | undefined;

  async function tick() {
    // Liveness is recorded on every fire, including the ones that return early
    // below. Suspension is the *absence* of fires, so a slow target still lets
    // the timer fire on schedule and is not mistaken for a sleeping machine.
    // Measuring between completed reads instead would let a target whose reads
    // outrun the interval reset the window forever, and a hold that can never
    // close is its own kind of failure.
    const tickAt = now();
    const previousTickAt = lastTickAt;
    lastTickAt = tickAt;

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
      const observedNow = now();
      // Missing an entire polling opportunity leaves an interval with no
      // evidence, even when target timestamps make the samples look contiguous.
      if (
        workflow.observation?.windowStartedAt != null &&
        previousTickAt !== undefined &&
        tickAt - previousTickAt >= intervalMs * 2
      ) {
        coordinator.resetObservation(id, observedNow);
      }
      const recorded = coordinator.observe(
        id,
        observed.healthValue,
        observed.observedAt,
        observedNow,
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
