import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { CloudRunAdapter } from "./cloud-run-adapter";
import { CLOUD_RUN_SCOPES, googleAccessToken } from "./google-token";

function adcFile(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "interlock-google-token-"));
  const path = join(directory, "adc.json");
  writeFileSync(path, JSON.stringify({
    type: "authorized_user",
    client_id: "client-id",
    client_secret: "client-secret",
    refresh_token: "refresh-token",
    quota_project_id: "must-not-be-forwarded",
  }));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return path;
}

test("Cloud Run uses an impersonated token with only its required scope", async (t) => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const request = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === "https://oauth2.googleapis.com/token") {
      return Response.json({ access_token: "adc-token", expires_in: 3600 });
    }
    if (url.startsWith("https://iamcredentials.googleapis.com/")) {
      return Response.json({
        accessToken: "impersonated-token",
        expireTime: new Date(3_601_000).toISOString(),
      });
    }
    if (url.startsWith("https://run.googleapis.com/")) {
      return Response.json({
        trafficStatuses: [{ revision: "checkout-v42", percent: 100 }],
      });
    }
    return Response.json({ value: 0.1, observedAt: 1234 });
  }) as typeof fetch;
  const accessToken = googleAccessToken({
    path: adcFile(t),
    request,
    impersonationTarget: "executor@example.invalid",
    now: () => 1_000,
  });
  const adapter = new CloudRunAdapter({
    project: "sample-project",
    region: "us-central1",
    service: "checkout",
    revision: "checkout-v42",
    healthUrl: "https://checkout.example.test/health",
  }, accessToken, request);

  await adapter.read();

  assert.equal(
    calls[1]?.url,
    "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/executor%40example.invalid:generateAccessToken",
  );
  assert.equal(calls[1]?.init?.headers && new Headers(calls[1].init.headers).get("authorization"), "Bearer adc-token");
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
    scope: CLOUD_RUN_SCOPES,
    lifetime: "3600s",
  });
  assert.equal(
    calls[2]?.init?.headers && new Headers(calls[2].init.headers).get("authorization"),
    "Bearer impersonated-token",
  );
  assert.equal(JSON.stringify(calls).includes("must-not-be-forwarded"), false);
  assert.equal(JSON.stringify(calls).includes("quota_project_id"), false);
});

test("impersonated tokens retain the expiry margin and refresh once", async (t) => {
  let now = 1_000;
  let adcExchanges = 0;
  let impersonationExchanges = 0;
  const request = (async (input: string | URL | Request) => {
    if (String(input) === "https://oauth2.googleapis.com/token") {
      adcExchanges += 1;
      return Response.json({ access_token: `adc-${adcExchanges}`, expires_in: 3600 });
    }
    impersonationExchanges += 1;
    return Response.json({
      accessToken: `impersonated-${impersonationExchanges}`,
      expireTime: new Date(now + 3_600_000).toISOString(),
    });
  }) as typeof fetch;
  const token = googleAccessToken({
    path: adcFile(t),
    request,
    impersonationTarget: "executor@example.invalid",
    now: () => now,
  });

  assert.equal(await token(), "impersonated-1");
  now += 3_539_999;
  assert.equal(await token(), "impersonated-1");
  now += 1;
  assert.equal(await token(), "impersonated-2");
  assert.deepEqual(
    { adcExchanges, impersonationExchanges },
    { adcExchanges: 2, impersonationExchanges: 2 },
  );
});

test("an unconfigured target loudly uses the distinguishable ADC fallback", async (t) => {
  const warnings: string[] = [];
  const calls: { url: string; init?: RequestInit }[] = [];
  const request = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return Response.json({ access_token: "adc-token", expires_in: 3600 });
  }) as typeof fetch;
  const token = googleAccessToken({
    path: adcFile(t),
    request,
    impersonationTarget: "",
    onAdcFallback: (message) => warnings.push(message),
    now: () => 1_000,
  });

  assert.equal(await token(), "adc-token");
  assert.equal(await token(), "adc-token");
  assert.deepEqual(warnings, [
    "GOOGLE_IMPERSONATE_SERVICE_ACCOUNT is unset; Cloud Run uses broad ADC fallback.",
  ]);
  assert.equal(calls.length, 1);
  assert.deepEqual(
    [...new URLSearchParams(String(calls[0]?.init?.body)).keys()].sort(),
    ["client_id", "client_secret", "grant_type", "refresh_token"],
  );
  assert.equal(JSON.stringify(calls).includes("quota_project_id"), false);
});
