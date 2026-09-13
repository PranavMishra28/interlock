import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
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
  const server = createCoordinator(store, { evidenceSource: "synthetic" });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/snapshot`);
    assert.equal(response.status, 200);
    const snapshot = await response.json() as {
      source: string;
      coordinator: { connected: boolean };
      listener: { connected: boolean };
      workflow: unknown;
    };
    assert.equal(snapshot.source, "synthetic");
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

test("Slack listener status requires a recent exact-workspace heartbeat", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-heartbeat-"));
  const store = new InterlockStore(join(dir, "state.db"));
  let now = 1_000;
  const server = createCoordinator(store, {
    ingressToken: "test-token",
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    now: () => now,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const send = (workspaceId: string) => fetch(`${base}/v1/slack/heartbeat`, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({ workspaceId, channelId: "C1", online: true }),
    });
    assert.equal((await send("T2")).status, 400);
    assert.equal((await send("T1")).status, 204);
    assert.equal(
      ((await (await fetch(`${base}/v1/snapshot`)).json()) as {
        listener: { connected: boolean };
      }).listener.connected,
      true,
    );
    now += 30_001;
    assert.equal(
      ((await (await fetch(`${base}/v1/snapshot`)).json()) as {
        listener: { connected: boolean };
      }).listener.connected,
      false,
    );
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
    allowedWorkspaceId: "T1",
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
      workspaceId: "T1",
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
      body: JSON.stringify({ ...source, workspaceId: "T2" }),
    })).status, 400);
    const accepted = await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify(source),
    });
    assert.equal(accepted.status, 201);
    assert.deepEqual((await accepted.json() as { context: unknown[] }).context, [source]);
    assert.equal(store.sourceContext("100").length, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("proposal endpoint binds latest attributed source to trusted resource", async () => {
  const dir = mkdtempSync(join(tmpdir(), "interlock-proposal-"));
  const store = new InterlockStore(join(dir, "state.db"));
  store.ingestSource({
    deliveryId: "Ev1",
    logicalMessageId: "100",
    revisionId: "100:r1",
    workspaceId: "T1",
    channelId: "C1",
    threadRef: "100",
    actorId: "U1",
    text: "Hold v42 until health is at most 1 for 60 seconds.",
    updated: false,
  });
  const server = createCoordinator(store, {
    ingressToken: "test-token",
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    workflowCoordinator: new InterlockCoordinator(store, {
      resourceId: "checkout",
      targetUrl: "https://checkout.example.test/health",
      candidateRevision: "v42",
      ownerId: "U-OWNER",
    }),
    now: () => 1_000,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}/v1/slack/proposals`;
    const send = (workspaceId: string, candidateRevision = "v42") => fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        channelId: "C1",
        resourceId: "checkout",
        candidateRevision,
        threadRef: "100",
        threshold: 1,
        windowMs: 60_000,
      }),
    });
    assert.equal((await send("T2")).status, 400);
    assert.equal((await send("T1", "v99")).status, 400);
    const created = await send("T1");
    assert.equal(created.status, 201);
    const proposal = await created.json() as {
      workflowId: string;
      resourceId: string;
      candidateRevision: string;
      cardToken: string;
    };
    assert.equal(proposal.resourceId, "checkout");
    assert.equal(proposal.candidateRevision, "v42");
    assert.equal(proposal.cardToken.length, 64);
    assert.equal(store.get(proposal.workflowId)?.contract.ownerId, "U-OWNER");
    assert.equal((await send("T1")).status, 200);
    assert.equal(store.list().length, 1);
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
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    workflowCoordinator,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address === "object");
    const url = `http://127.0.0.1:${address.port}/v1/slack/approve`;
    const cardToken = createHmac("sha256", "test-token")
      .update("hold-42\0" + "2\0checkout\0v42")
      .digest("hex");
    const send = (actorId: string, revision = 2) => fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workflowId: "hold-42",
        workspaceId: "T1",
        resourceId: "checkout",
        candidateRevision: "v42",
        cardToken,
        actorId,
        revision,
      }),
    });
    assert.equal((await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workflowId: "hold-42",
        workspaceId: "T2",
        resourceId: "checkout",
        candidateRevision: "v42",
        cardToken,
        actorId: "U-OWNER",
        revision: 2,
      }),
    })).status, 400);
    assert.equal((await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workflowId: "hold-42",
        workspaceId: "T1",
        resourceId: "checkout",
        candidateRevision: "v42",
        cardToken: "not-the-rendered-card",
        actorId: "U-OWNER",
        revision: 2,
      }),
    })).status, 403);
    assert.equal((await fetch(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workflowId: "hold-42",
        workspaceId: "T1",
        resourceId: "checkout",
        candidateRevision: "v99",
        cardToken,
        actorId: "U-OWNER",
        revision: 2,
      }),
    })).status, 403);
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
