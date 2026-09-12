import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCoordinator } from "./coordinator";
import { InterlockStore } from "./interlock-store";
import { InterlockCoordinator } from "./interlock-coordinator";

test("loopback coordinator exposes read-only persisted state", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-coordinator-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const server = createCoordinator(store);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/snapshot`);
    assert.equal(response.status, 200);
    const snapshot = await response.json() as {
      coordinator: { connected: boolean };
      listener: { connected: boolean };
      workflow: unknown;
    };
    assert.equal(snapshot.coordinator.connected, true);
    assert.equal(snapshot.listener.connected, false);
    assert.equal(snapshot.workflow, null);

    const mutation = await fetch(
      `http://127.0.0.1:${address.port}/v1/snapshot`,
      { method: "POST" },
    );
    assert.equal(mutation.status, 404);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("authenticated Slack ingress accepts one exact-channel delivery", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-ingress-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const server = createCoordinator(store, {
    ingressToken: "test-token",
    allowedChannelId: "C1",
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}/v1/slack/events`;
    const source = {
      deliveryId: "Ev1",
      logicalMessageId: "100",
      revisionId: "100:r1",
      channelId: "C1",
      threadRef: "100",
      actorId: "U1",
      text: "Hold v42.",
      updated: false,
    };
    assert.equal((await fetch(url, { method: "POST" })).status, 401);
    assert.equal((await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...source, channelId: "C2" }),
    })).status, 400);
    assert.equal((await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify(source),
    })).status, 201);
    assert.equal(store.sourceContext("100").length, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Slack approval endpoint delegates exact actor and revision authority", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-approval-"));
  const store = new InterlockStore(join(dir, "state.db"));
  const trusted = {
    resourceId: "checkout",
    targetUrl: "https://checkout.example.test/health",
    candidateRevision: "v42",
    ownerId: "U-OWNER",
  };
  const workflowCoordinator = new InterlockCoordinator(store, trusted);
  const now = Date.now();
  workflowCoordinator.propose({
    id: "hold-42",
    revision: 2,
    sourceDeliveryId: "Ev1",
    sourceMessageRef: "C1:100",
    ...trusted,
    threshold: 1,
    windowMs: 1_000,
    maxSampleAgeMs: 250,
    maxSampleGapMs: 600,
    proposalExpiresAt: now + 60_000,
  }, now);
  const server = createCoordinator(store, {
    ingressToken: "test-token",
    allowedChannelId: "C1",
    workflowCoordinator,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}/v1/slack/approve`;
    const send = (actorId: string, revision = 2) => fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({ workflowId: "hold-42", actorId, revision }),
    });
    assert.equal((await send("U-JUNIOR")).status, 403);
    assert.equal((await send("U-OWNER", 1)).status, 403);
    assert.equal((await send("U-OWNER")).status, 200);
    assert.equal(store.get("hold-42")?.status, "ACTIVE_HOLD");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
