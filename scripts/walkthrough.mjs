#!/usr/bin/env node
import { closeSync, constants, mkdirSync, openSync } from "node:fs";
import { chmod, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = resolve(root, ".interlock/walkthrough-notes.md");
const mode = process.argv[2] ?? "--preflight";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function preflight() {
  const phase = await readFile(resolve(root, ".hackathon-phase"), "utf8");
  if (!/^PHASE=BUILD_ACTIVE$/m.test(phase) || !/^AUTHORIZATION=RECORDED$/m.test(phase)) {
    throw new Error("Walkthrough requires the recorded BUILD_ACTIVE phase.");
  }

  mkdirSync(dirname(artifact), { recursive: true });
  try {
    closeSync(openSync(artifact, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600));
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }
  await chmod(artifact, 0o600);

  const ignored = spawnSync("git", ["check-ignore", "--quiet", "--", artifact], {
    cwd: root,
    stdio: "ignore",
  });
  if (ignored.status !== 0) {
    throw new Error(".interlock/walkthrough-notes.md is not ignored; stop before writing notes.");
  }

  console.log(`Preflight passed (offline). Confidential notes: ${artifact}`);
  console.log("No service, credential check, dev server, coordinator, or network call ran.");
  console.log("\nSynthetic product-logic story (no Slack channel and no people talking):");
  console.log("  Terminal A: npm run demo --workspace web -- --reset");
  console.log("  Terminal B: INTERLOCK_COORDINATOR_URL=http://127.0.0.1:4318 npm run dev:web");
  console.log("  Open: http://localhost:3100");
  console.log("  Terminal A beats: wrong actor refused; wrong revision refused; exact owner");
  console.log("  approved; active hold refused promotion; synthetic recovery; RETIRED.");
  console.log("  Control Room: TEST INPUT — SYNTHETIC, elapsed window, resets, v42 receipt.");
  console.log("\nLive SLACK-1 only: use the one channel named by INTERLOCK_SLACK_CHANNEL_ID.");
  console.log("Invite the existing Interlock bot there with /invite @Interlock, then one human");
  console.log("posts one ordinary unmentioned message. Do not create channels or emulate people.");
  console.log("The notes file stays blank; the operator guide is the RUNBOOK section below.");
  console.log("Full gates: docs/RUNBOOK.md#canonical-private-test-and-recorded-demo-walkthrough");
}

function coordinatorUrl() {
  const url = new URL(required("INTERLOCK_COORDINATOR_URL"));
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1") {
    throw new Error("INTERLOCK_COORDINATOR_URL must be loopback http://127.0.0.1.");
  }
  return url;
}

async function setFault(state) {
  if (state !== "on" && state !== "off") {
    throw new Error("Use --fault on or --fault off.");
  }
  const target = new URL(required("INTERLOCK_TARGET_URL"));
  if (target.protocol !== "https:") {
    throw new Error("INTERLOCK_TARGET_URL must use HTTPS.");
  }
  const response = await fetch(new URL(`/fault?state=${state}`, target), {
    method: "POST",
    redirect: "error",
    headers: { authorization: `Bearer ${required("CHECKOUT_FAULT_TOKEN")}` },
  });
  if (response.status !== 204) {
    throw new Error(`Target fault switch returned HTTP ${response.status}.`);
  }
  console.log(`Target fault is ${state}; verify the Control Room observation.`);
}

async function proveRefusal() {
  const base = coordinatorUrl();
  const snapshotResponse = await fetch(new URL("/v1/snapshot", base), {
    redirect: "error",
  });
  if (!snapshotResponse.ok) {
    throw new Error(`Coordinator snapshot returned HTTP ${snapshotResponse.status}.`);
  }
  const workflow = (await snapshotResponse.json()).workflow;
  if (!workflow?.contract?.id) {
    throw new Error("No active workflow is visible; stop without claiming refusal.");
  }
  const response = await fetch(new URL("/v1/promote", base), {
    method: "POST",
    redirect: "error",
    headers: {
      authorization: `Bearer ${required("INTERLOCK_COORDINATOR_TOKEN")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ workflowId: workflow.contract.id }),
  });
  const decision = await response.json().catch(() => ({}));
  if (response.status !== 409 || decision.allowed !== false) {
    throw new Error(`Expected a held-operation HTTP 409 refusal; received HTTP ${response.status}.`);
  }
  console.log(`Refusal proved: HTTP 409, ${decision.reason ?? "operation held"}.`);
}

try {
  if (mode === "--preflight") await preflight();
  else if (mode === "--fault") await setFault(process.argv[3]);
  else if (mode === "--refuse") await proveRefusal();
  else throw new Error("Usage: walkthrough.mjs [--preflight | --fault on|off | --refuse]");
} catch (error) {
  console.error(`Walkthrough stopped: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
