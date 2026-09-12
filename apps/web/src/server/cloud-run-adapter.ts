import type {
  TargetAdapter,
  TargetObservation,
} from "./interlock-coordinator";
import { isIP } from "node:net";

type CloudRunConfig = {
  project: string;
  region: string;
  service: string;
  revision: string;
  healthUrl: string;
};

function boundedConfig(config: CloudRunConfig) {
  for (const [name, value] of Object.entries(config)) {
    if (name !== "healthUrl" && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
      throw new Error(`Cloud Run ${name} is not a safe resource identifier.`);
    }
  }
  const health = new URL(config.healthUrl);
  if (
    health.protocol !== "https:" ||
    health.username ||
    health.password ||
    health.hash ||
    health.hostname === "localhost" ||
    health.hostname.endsWith(".local") ||
    isIP(health.hostname.replace(/^\[|\]$/g, "")) !== 0 ||
    /^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(health.hostname)
  ) {
    throw new Error("Cloud Run health URL must be an exact public HTTPS URL.");
  }
}

async function boundedJson(response: Response, limit = 64_000) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    throw new Error("Cloud Run response exceeds the size limit.");
  }
  if (!response.body) throw new Error("Cloud Run response body is missing.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("Cloud Run response exceeds the size limit.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

export class CloudRunAdapter implements TargetAdapter {
  readonly serviceName: string;

  constructor(
    readonly config: CloudRunConfig,
    readonly accessToken: () => Promise<string>,
    readonly request: typeof fetch = fetch,
    readonly pause: (ms: number) => Promise<void> =
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    boundedConfig(config);
    this.serviceName =
      `projects/${config.project}/locations/${config.region}/services/${config.service}`;
  }

  async promote(revision: string, _operationId: string) {
    if (revision !== this.config.revision) {
      throw new Error("Cloud Run revision is not the allowlisted candidate.");
    }
    const token = await this.accessToken();
    const response = await this.request(
      `https://run.googleapis.com/v2/${this.serviceName}?updateMask=traffic`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: this.serviceName,
          traffic: [{
            type: "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION",
            revision,
            percent: 100,
          }],
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) throw new Error(`Cloud Run update failed (${response.status}).`);
    const operation = await boundedJson(response) as { name?: string };
    const operationPrefix =
      `projects/${this.config.project}/locations/${this.config.region}/operations/`;
    const operationId = operation.name?.slice(operationPrefix.length);
    if (
      !operation.name?.startsWith(operationPrefix) ||
      !operationId ||
      !/^[A-Za-z0-9-]+$/.test(operationId)
    ) {
      throw new Error("Cloud Run update returned an unexpected operation name.");
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const result = await this.request(
        `https://run.googleapis.com/v2/${operation.name}`,
        {
          headers: { authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!result.ok) throw new Error(`Cloud Run operation read failed (${result.status}).`);
      const state = await boundedJson(result) as {
        done?: boolean;
        error?: { message?: string };
      };
      if (state.error) throw new Error(state.error.message ?? "Cloud Run operation failed.");
      if (state.done) return;
      await this.pause(1_000);
    }
    throw new Error("Cloud Run update did not finish within 20 seconds.");
  }

  async read(): Promise<TargetObservation> {
    const token = await this.accessToken();
    const [serviceResponse, healthResponse] = await Promise.all([
      this.request(`https://run.googleapis.com/v2/${this.serviceName}`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5_000),
      }),
      this.request(this.config.healthUrl, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5_000),
      }),
    ]);
    if (!serviceResponse.ok || !healthResponse.ok) {
      throw new Error("Target-specific verification read failed.");
    }
    const service = await boundedJson(serviceResponse) as {
      trafficStatuses?: { revision?: string; percent?: number }[];
    };
    const health = await boundedJson(healthResponse, 8_000) as {
      value?: number;
      observedAt?: number;
    };
    const route = service.trafficStatuses?.reduce((highest, candidate) =>
      (candidate.percent ?? -1) > (highest.percent ?? -1) ? candidate : highest
    );
    if (
      typeof route?.revision !== "string" ||
      typeof route?.percent !== "number" ||
      typeof health.value !== "number" ||
      typeof health.observedAt !== "number"
    ) {
      throw new Error("Target verification response is incomplete.");
    }
    return {
      revision: route.revision,
      trafficPercent: route.percent,
      healthValue: health.value,
      observedAt: health.observedAt,
    };
  }
}
