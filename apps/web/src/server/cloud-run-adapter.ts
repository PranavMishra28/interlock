import type {
  TargetAdapter,
  TargetObservation,
} from "./interlock-coordinator";

type CloudRunConfig = {
  project: string;
  region: string;
  service: string;
  revision: string;
  healthUrl: string;
};

export class CloudRunAdapter implements TargetAdapter {
  readonly serviceName: string;

  constructor(
    readonly config: CloudRunConfig,
    readonly accessToken: () => Promise<string>,
    readonly request: typeof fetch = fetch,
    readonly pause: (ms: number) => Promise<void> =
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
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
      },
    );
    if (!response.ok) throw new Error(`Cloud Run update failed (${response.status}).`);
    const operation = await response.json() as { name?: string };
    if (!operation.name) throw new Error("Cloud Run update returned no operation name.");

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const result = await this.request(
        `https://run.googleapis.com/v2/${operation.name}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      if (!result.ok) throw new Error(`Cloud Run operation read failed (${result.status}).`);
      const state = await result.json() as {
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
      }),
      this.request(this.config.healthUrl, { cache: "no-store" }),
    ]);
    if (!serviceResponse.ok || !healthResponse.ok) {
      throw new Error("Target-specific verification read failed.");
    }
    const service = await serviceResponse.json() as {
      trafficStatuses?: { revision?: string; percent?: number }[];
    };
    const health = await healthResponse.json() as {
      value?: number;
      observedAt?: number;
    };
    const route = service.trafficStatuses?.find(
      ({ revision }) => revision === this.config.revision,
    );
    if (
      typeof route?.percent !== "number" ||
      typeof health.value !== "number" ||
      typeof health.observedAt !== "number"
    ) {
      throw new Error("Target verification response is incomplete.");
    }
    return {
      revision: this.config.revision,
      trafficPercent: route.percent,
      healthValue: health.value,
      observedAt: health.observedAt,
    };
  }
}
