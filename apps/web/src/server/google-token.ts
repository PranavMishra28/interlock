import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type AuthorizedUser = {
  type?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
};

export const CLOUD_RUN_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
] as const;

type GoogleAccessTokenOptions = {
  path?: string;
  request?: typeof fetch;
  impersonationTarget?: string;
  onAdcFallback?: (message: string) => void;
  now?: () => number;
};

/**
 * Application Default Credentials hold a `quota_project_id` that may name an
 * unrelated project. Interlock never forwards it: quota and billing must
 * attribute to the project that owns the Cloud Run service, never to whichever
 * project the workstation happened to configure last.
 */
export function adcPath() {
  return (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    join(homedir(), ".config", "gcloud", "application_default_credentials.json")
  );
}

export function googleAccessToken(options: GoogleAccessTokenOptions = {}): () => Promise<string> {
  const {
    path = adcPath(),
    request = fetch,
    impersonationTarget = process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT,
    onAdcFallback = console.warn,
    now = Date.now,
  } = options;
  let cached: { token: string; expiresAt: number } | undefined;
  let warnedAboutAdc = false;

  return async () => {
    if (cached && now() < cached.expiresAt) return cached.token;

    const target = impersonationTarget?.trim();
    if (!target && !warnedAboutAdc) {
      // Local fallback keeps the verified path available, but must never look
      // equivalent to the least-privilege execution identity.
      onAdcFallback(
        "GOOGLE_IMPERSONATE_SERVICE_ACCOUNT is unset; Cloud Run uses broad ADC fallback.",
      );
      warnedAboutAdc = true;
    }

    let credential: AuthorizedUser;
    try {
      credential = JSON.parse(await readFile(path, "utf8")) as AuthorizedUser;
    } catch {
      throw new Error(
        "Google credentials are unavailable. Run `gcloud auth application-default login`.",
      );
    }
    const { type, client_id, client_secret, refresh_token } = credential;
    if (type !== "authorized_user" || !client_id || !client_secret || !refresh_token) {
      throw new Error(
        "Interlock needs authorized-user Application Default Credentials.",
      );
    }

    const response = await request("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Google token exchange failed (${response.status}).`);
    }
    const token = await response.json() as {
      access_token?: string;
      expires_in?: number;
    };
    if (typeof token.access_token !== "string" || !token.access_token) {
      throw new Error("Google token exchange returned no access token.");
    }

    let accessToken = token.access_token;
    let lifetime = typeof token.expires_in === "number" ? token.expires_in : 3_600;
    if (target) {
      const impersonated = await request(
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(target)}:generateAccessToken`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            scope: CLOUD_RUN_SCOPES,
            lifetime: "3600s",
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!impersonated.ok) {
        throw new Error(
          `Google service-account impersonation failed (${impersonated.status}).`,
        );
      }
      const generated = await impersonated.json() as {
        accessToken?: string;
        expireTime?: string;
      };
      if (typeof generated.accessToken !== "string" || !generated.accessToken) {
        throw new Error("Google impersonation returned no access token.");
      }
      const expiresAt = Date.parse(generated.expireTime ?? "");
      if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
        throw new Error("Google impersonation returned an invalid expiry.");
      }
      accessToken = generated.accessToken;
      lifetime = (expiresAt - now()) / 1_000;
    }

    cached = {
      token: accessToken,
      expiresAt: now() + Math.max(lifetime - 60, 30) * 1_000,
    };
    return cached.token;
  };
}
