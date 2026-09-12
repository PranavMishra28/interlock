import assert from "node:assert/strict";
import test from "node:test";
import { interlockProposal } from "./approval";

test("proposal tool persists trusted source binding before posting approval", async () => {
  const requests: RequestInit[] = [];
  const posted: unknown[] = [];
  const registered: { componentName: string; props: Record<string, unknown> }[] = [];
  const tool = interlockProposal({
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    resourceId: "checkout",
    candidateRevision: "v42",
    coordinatorUrl: "http://127.0.0.1:4317",
    token: "test-token",
    request: (async (_input, init) => {
      requests.push(init!);
      return Response.json({
        workflowId: "hold-42",
        revision: 3,
        resourceId: "checkout",
        candidateRevision: "v42",
        cardToken: "card-token",
        condition: "Health must remain at or below 1 for 60 seconds.",
      }, { status: 201 });
    }) as typeof fetch,
  });
  const result = await tool.handler({
    resourceId: "checkout",
    candidateRevision: "v42",
    threshold: 1,
    windowMs: 60_000,
  }, {
    platform: "slack",
    actor: { id: "U1", kind: "human" },
    user: { id: "slack:T1:U1", name: "User" },
    thread: {
      state: async () => ({ interlockThreadRef: "100" }),
      post: async (value: unknown) => {
        posted.push(value);
        return { id: "message-1" };
      },
      postRegisteredComponent: async (
        componentName: string,
        props: Record<string, unknown>,
      ) => {
        registered.push({ componentName, props });
        return { id: "message-1" };
      },
    } as never,
  });
  assert.match(String(result), /Persisted and displayed/);
  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(String(requests[0]?.body)), {
    workspaceId: "T1",
    channelId: "C1",
    resourceId: "checkout",
    candidateRevision: "v42",
    threadRef: "100",
    threshold: 1,
    windowMs: 60_000,
  });

  // The card must be posted by registered name with its exact persisted props.
  // Pre-rendered IR would leave an approval button that cannot be rebuilt
  // after a listener restart, so posting through `post` is a defect here.
  assert.deepEqual(posted, []);
  assert.equal(registered.length, 1);
  assert.equal(registered[0]?.componentName, "interlock_approval");
  assert.deepEqual(registered[0]?.props, {
    workflowId: "hold-42",
    revision: 3,
    resourceId: "checkout",
    candidateRevision: "v42",
    cardToken: "card-token",
    condition: "Health must remain at or below 1 for 60 seconds.",
  });
});

test("proposal refuses a runtime that cannot post a durable approval", async () => {
  const tool = interlockProposal({
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    resourceId: "checkout",
    candidateRevision: "v42",
    coordinatorUrl: "http://127.0.0.1:4317",
    token: "test-token",
    request: (async () =>
      Response.json({
        workflowId: "hold-42",
        revision: 3,
        resourceId: "checkout",
        candidateRevision: "v42",
        cardToken: "card-token",
        condition: "Health must remain at or below 1 for 60 seconds.",
      }, { status: 201 })) as typeof fetch,
  });
  await assert.rejects(
    async () => {
      await tool.handler({
        resourceId: "checkout",
        candidateRevision: "v42",
        threshold: 1,
        windowMs: 60_000,
      }, {
        platform: "slack",
        actor: { id: "U1", kind: "human" },
        user: { id: "slack:T1:U1", name: "User" },
        thread: {
          state: async () => ({ interlockThreadRef: "100" }),
          post: async () => ({ id: "message-1" }),
        } as never,
      });
    },
    /could not survive a listener restart/,
  );
});

test("proposal tool rejects a model-supplied revision outside the allowlist", async () => {
  let requested = false;
  const tool = interlockProposal({
    allowedWorkspaceId: "T1",
    allowedChannelId: "C1",
    resourceId: "checkout",
    candidateRevision: "v42",
    coordinatorUrl: "http://127.0.0.1:4317",
    token: "test-token",
    request: (async () => {
      requested = true;
      return Response.json({});
    }) as typeof fetch,
  });
  const result = await tool.handler({
    resourceId: "checkout",
    candidateRevision: "v99",
    threshold: 1,
    windowMs: 60_000,
  }, {
    platform: "slack",
    actor: { id: "U1", kind: "human" },
    user: { id: "slack:T1:U1", name: "User" },
    thread: {} as never,
  });
  assert.match(String(result), /not allowlisted/);
  assert.equal(requested, false);
});
