import assert from "node:assert/strict";
import test from "node:test";
import { CloudRunAdapter } from "./cloud-run-adapter";

const config = {
  project: "personal-project",
  region: "us-central1",
  service: "checkout",
  revision: "checkout-v42",
  healthUrl: "https://checkout.example.test/health",
};

test("Cloud Run adapter promotes only the exact revision and reads target evidence", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const responses = [
    Response.json({ name: "projects/p/locations/r/operations/op-1" }),
    Response.json({ done: true }),
    Response.json({
      trafficStatuses: [{ revision: "checkout-v42", percent: 100 }],
    }),
    Response.json({ value: 0.4, observedAt: 1234 }),
  ];
  const request = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return responses.shift()!;
  }) as typeof fetch;
  const adapter = new CloudRunAdapter(
    config,
    async () => "test-access-token",
    request,
    async () => {},
  );

  await assert.rejects(adapter.promote("checkout-v43", "op"), /not the allowlisted/);
  await adapter.promote("checkout-v42", "op");
  assert.equal(calls[0]?.url, "https://run.googleapis.com/v2/projects/personal-project/locations/us-central1/services/checkout?updateMask=traffic");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    name: "projects/personal-project/locations/us-central1/services/checkout",
    traffic: [{
      type: "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION",
      revision: "checkout-v42",
      percent: 100,
    }],
  });
  assert.equal(calls[1]?.url, "https://run.googleapis.com/v2/projects/p/locations/r/operations/op-1");

  assert.deepEqual(await adapter.read(), {
    revision: "checkout-v42",
    trafficPercent: 100,
    healthValue: 0.4,
    observedAt: 1234,
  });
  assert.equal(calls[3]?.url, config.healthUrl);
});

test("Cloud Run operation polling is bounded", async () => {
  let calls = 0;
  const request = (async () => {
    calls += 1;
    return calls === 1
      ? Response.json({ name: "operations/op-1" })
      : Response.json({ done: false });
  }) as typeof fetch;
  const adapter = new CloudRunAdapter(
    config,
    async () => "test-access-token",
    request,
    async () => {},
  );
  await assert.rejects(
    adapter.promote("checkout-v42", "op"),
    /within 20 seconds/,
  );
  assert.equal(calls, 21);
});
