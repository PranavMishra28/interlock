/**
 * Live verification against the real Cloud Run target. Not part of the offline
 * test suite: it needs credentials and the network, and `--promote` moves real
 * traffic.
 *
 *   node --import tsx --env-file-if-exists=../../.env src/server/live-check.ts
 *   node --import tsx --env-file-if-exists=../../.env src/server/live-check.ts --promote
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_CLOCK_SKEW_MS } from "agent-core/interlock";
import type { Contract, TrustedResource } from "agent-core/interlock";
import { CloudRunAdapter } from "./cloud-run-adapter";
import { googleAccessToken } from "./google-token";
import { InterlockCoordinator } from "./interlock-coordinator";
import { InterlockStore } from "./interlock-store";
import { createSupervisor } from "./supervisor";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the live check.`);
  return value;
}

const OWNER = process.env.INTERLOCK_OWNER_ID || "U-LIVE-CHECK-OWNER";

async function main() {
  const targetUrl = required("INTERLOCK_TARGET_URL");
  const candidateRevision = required("INTERLOCK_TARGET_REVISION");
  // Harness affordance only: lets the live check run from a gcloud CLI token
  // while Application Default Credentials need reauthentication. The
  // coordinator process itself always uses ADC.
  const supplied = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  const adapter = new CloudRunAdapter(
    {
      project: required("GOOGLE_CLOUD_PROJECT"),
      region: required("GOOGLE_CLOUD_REGION"),
      service: required("INTERLOCK_TARGET_SERVICE"),
      revision: candidateRevision,
      healthUrl: new URL("/health", targetUrl).toString(),
    },
    supplied ? async () => supplied : googleAccessToken(),
  );

  console.log("▸ Live read-back");
  const before = await adapter.read();
  console.log(`  serving   ${before.revision} at ${before.trafficPercent}%`);
  console.log(`  health    ${before.healthValue}`);

  // The domain treats a sample dated after the coordinator's clock as a "clock"
  // reset, so the real skew between this machine and the container decides
  // whether a live hold can ever close. Measure it rather than assume it.
  console.log("▸ Clock skew (target sample vs local clock)");
  let worst = Number.NEGATIVE_INFINITY;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sample = await adapter.read();
    const skew = sample.observedAt - Date.now();
    worst = Math.max(worst, skew);
    console.log(`  sample ${attempt + 1}: ${skew > 0 ? "+" : ""}${skew} ms`);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  console.log(
    `  worst ${worst > 0 ? "+" : ""}${worst} ms against a ${MAX_CLOCK_SKEW_MS} ms ` +
      `allowance — ${
        worst > MAX_CLOCK_SKEW_MS
          ? "BEYOND tolerance; every sample would reset the window"
          : "within tolerance, so the window can close"
      }`,
  );

  if (!process.argv.includes("--promote")) {
    console.log("\nRead-back only. Pass --promote to drive a full hold.");
    return;
  }

  const trusted: TrustedResource = {
    resourceId: required("INTERLOCK_RESOURCE_ID"),
    targetUrl,
    candidateRevision,
    ownerId: OWNER,
  };
  const dir = mkdtempSync(join(tmpdir(), "interlock-live-"));
  const store = new InterlockStore(join(dir, "live.db"));
  const coordinator = new InterlockCoordinator(store, trusted);
  try {
    const now = Date.now();
    const contract: Contract = {
      id: `live-${now}`,
      revision: 1,
      sourceDeliveryId: `live-delivery-${now}`,
      sourceMessageRef: "live-check:manual",
      ...trusted,
      threshold: 0.5,
      windowMs: 10_000,
      maxSampleAgeMs: 30_000,
      maxSampleGapMs: 15_000,
      proposalExpiresAt: now + 300_000,
    };

    console.log("\n▸ Hold");
    coordinator.propose(contract, now);
    coordinator.approve(contract.id, OWNER, contract.revision, Date.now());
    console.log(
      `  approved; holding ${candidateRevision} until health stays at or below ` +
        `${contract.threshold} for ${contract.windowMs / 1_000}s`,
    );

    const supervisor = createSupervisor({
      coordinator,
      adapter,
      onError: (error) =>
        console.log(
          `  observation failed: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        ),
    });

    const deadline = Date.now() + 120_000;
    let status = "";
    while (Date.now() < deadline) {
      await supervisor.tick();
      const current = store.get(contract.id);
      if (current && current.status !== status) {
        status = current.status;
        const window = current.observation?.windowStartedAt;
        console.log(
          `  ${status}${
            window ? ` (window open ${Date.now() - window}ms)` : ""
          }`,
        );
      }
      if (current?.status === "RETIRED" || current?.status === "NEEDS_INTERVENTION") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }

    const final = store.get(contract.id);
    console.log("\n▸ Outcome");
    console.log(`  status    ${final?.status}`);
    if (final?.receipt) {
      console.log(`  expected  ${final.receipt.expectedRevision}`);
      console.log(`  observed  ${final.receipt.observedRevision}`);
      console.log(`  traffic   ${final.receipt.trafficPercent}%`);
      console.log(`  health    ${final.receipt.healthValue}`);
      console.log(`  resets    ${final.observation?.resets.length ?? 0}`);
    }
    if (final?.verification && !final.receipt) {
      console.log(`  verification mismatch: ${JSON.stringify(final.verification)}`);
    }
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
