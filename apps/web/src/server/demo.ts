import { rmSync } from "node:fs";
import { type Server } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Contract, TrustedResource } from "agent-core/interlock";
import { createCoordinator } from "./coordinator";
import {
  InterlockCoordinator,
  type TargetAdapter,
  type TargetObservation,
} from "./interlock-coordinator";
import { InterlockStore } from "./interlock-store";
import { createSupervisor } from "./supervisor";

export const DEMO_TRUSTED: TrustedResource = {
  resourceId: "checkout",
  targetUrl: "http://127.0.0.1:4318/demo-target",
  candidateRevision: "v42",
  ownerId: "U-DEMO-OWNER",
};

export class DemoTarget implements TargetAdapter {
  revision = "v41";
  healthValue = 0.9;
  dispatches = 0;

  async promote(revision: string) {
    if (revision !== DEMO_TRUSTED.candidateRevision) {
      throw new Error("Demo target refused a revision outside the allowlist.");
    }
    this.dispatches += 1;
    this.revision = revision;
  }

  async read(): Promise<TargetObservation> {
    return {
      revision: this.revision,
      trafficPercent: 100,
      healthValue: this.healthValue,
      observedAt: Date.now(),
    };
  }
}

export function seedDemo(
  store: InterlockStore,
  coordinator: InterlockCoordinator,
  now = Date.now(),
) {
  const existing = store.get("demo-hold-v42");
  if (existing) return existing;

  store.ingestSource({
    deliveryId: "demo-delivery-v42",
    logicalMessageId: "demo-message-v42",
    revisionId: "demo-message-v42:r1",
    workspaceId: "T-DEMO",
    channelId: "C-DEMO",
    threadRef: "demo-thread-v42",
    actorId: "U-DEMO-ENGINEER",
    text:
      "Hold v42 until checkout health stays at or below 0.5 for 6 seconds.",
    updated: false,
  }, now);

  const contract: Contract = {
    id: "demo-hold-v42",
    revision: 1,
    sourceDeliveryId: "demo-delivery-v42",
    sourceMessageRef: "#demo-incident · synthetic input",
    ...DEMO_TRUSTED,
    threshold: 0.5,
    windowMs: 6_000,
    maxSampleAgeMs: 5_000,
    maxSampleGapMs: 2_500,
    proposalExpiresAt: now + 300_000,
  };
  coordinator.propose(contract, now);
  return coordinator.approve(
    contract.id,
    DEMO_TRUSTED.ownerId,
    contract.revision,
    now + 1,
  );
}

function demoDatabasePath() {
  return resolve(
    fileURLToPath(new URL("../../../../", import.meta.url)),
    ".interlock/demo.db",
  );
}

function resetDemo(path: string) {
  for (const suffix of ["", "-wal", "-shm", ".lock"]) {
    rmSync(`${path}${suffix}`, { force: true });
  }
}

async function start() {
  const path = demoDatabasePath();
  if (process.argv.includes("--reset")) resetDemo(path);

  const store = new InterlockStore(path);
  const coordinator = new InterlockCoordinator(store, DEMO_TRUSTED);
  const workflow = seedDemo(store, coordinator);
  const target = new DemoTarget();
  const server = createCoordinator(store, {
    evidenceSource: "synthetic",
    workflowCoordinator: coordinator,
  });
  const supervisor = createSupervisor({
    coordinator,
    adapter: target,
    intervalMs: 1_000,
    onError: (error) =>
      console.error(
        "Demo observation failed:",
        error instanceof Error ? error.message : "unknown error",
      ),
  });

  await new Promise<void>((ready) =>
    server.listen(4318, "127.0.0.1", ready)
  );
  console.log("Interlock demo coordinator: http://127.0.0.1:4318");
  console.log(`Persistent demo store: ${path}`);
  console.log(`Starting state: ${workflow.status}; target health 0.9 (unhealthy)`);

  let lastStatus = workflow.status;
  const statusLog = setInterval(() => {
    const current = store.get(workflow.contract.id);
    if (current && current.status !== lastStatus) {
      lastStatus = current.status;
      console.log(
        `Workflow: ${current.status}; resets ${current.observation?.resets.length ?? 0}`,
      );
    }
  }, 250);
  statusLog.unref();

  // Hold unhealthy long enough to make refusal visible, then serve one full
  // clean window. This is a synthetic test input, never a cloud claim.
  const recovery = setTimeout(() => {
    target.healthValue = 0.1;
    console.log("Synthetic target recovered: health 0.1");
  }, 4_000);
  recovery.unref();
  supervisor.start();
  await supervisor.tick();

  const close = () => {
    clearTimeout(recovery);
    clearInterval(statusLog);
    supervisor.stop();
    server.close(() => {
      store.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
