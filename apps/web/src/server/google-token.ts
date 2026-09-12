import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type AuthorizedUser = {
  type?: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
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

export function googleAccessToken(
  path = adcPath(),
  request: typeof fetch = fetch,
): () => Promise<string> {
  let cached: { token: string; expiresAt: number } | undefined;

  return async () => {
    if (cached && Date.now() < cached.expiresAt) return cached.token;

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
    const lifetime = typeof token.expires_in === "number" ? token.expires_in : 3_600;
    cached = {
      token: token.access_token,
      expiresAt: Date.now() + Math.max(lifetime - 60, 30) * 1_000,
    };
    return cached.token;
  };
}
