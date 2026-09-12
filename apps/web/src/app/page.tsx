import {
  emptyState,
  executionGate,
  healthChartDomain,
  healthChartX,
  healthChartY,
  lifecycleNext,
  lifecycleReached,
  loadSnapshot,
} from "@/lib/control-room";

const lifecycle = [
  "Source",
  "Proposal",
  "Approval",
  "Hold",
  "Observation",
  "Claim",
  "Dispatch",
  "Verification",
  "Retirement",
] as const;

export default async function Home() {
  const snapshot = await loadSnapshot();
  const workflow = snapshot.workflow;
  const resets = workflow?.observation?.resets ?? [];
  const chartTimes = [
    ...snapshot.samples.map(({ observedAt }) => observedAt),
    ...resets.map(({ at }) => at),
  ];
  const chartStart = Math.min(...chartTimes);
  const chartEnd = Math.max(...chartTimes);
  const chartX = (at: number) => healthChartX(at, chartStart, chartEnd);
  const chartDomain = workflow
    ? healthChartDomain(workflow.contract.threshold, snapshot.samples)
    : 1;
  const points = snapshot.samples.map((sample) => ({
    ...sample,
    x: chartX(sample.observedAt),
    y: healthChartY(sample.value, chartDomain),
  }));
  const latestReset = resets.reduce<typeof resets[number] | undefined>(
    (latest, reset) => !latest || reset.at > latest.at ? reset : latest,
    undefined,
  );
  const lastSample = snapshot.samples.reduce<typeof snapshot.samples[number] | undefined>(
    (latest, sample) =>
      !latest || sample.observedAt > latest.observedAt ? sample : latest,
    undefined,
  );
  const elapsed = workflow?.observation?.windowStartedAt
    ? Math.max(0, workflow.observation.observedAt - workflow.observation.windowStartedAt)
    : 0;

  return (
    <main className="cr-shell">
      <header className="cr-header">
        <div>
          <p className="ck-eyebrow">Operational constraint · Checkout</p>
          <h1>Checkout release constraint</h1>
          <p className="ck-intro">
            One decision. One authority boundary. Independently verified.
          </p>
        </div>
        <span
          className="cr-mode"
          data-source={snapshot.coordinator.connected ? snapshot.source : "coordinator-error"}
        >
          {snapshot.coordinator.connected
            ? snapshot.source === "synthetic" ? "TEST INPUT — SYNTHETIC" : "Coordinator data"
            : snapshot.source === "synthetic"
              ? "TEST INPUT — SYNTHETIC · COORDINATOR UNREACHABLE"
              : "Coordinator unreachable"}
        </span>
      </header>

      {snapshot.notice ? <p className="cr-alert" role="status">{snapshot.notice}</p> : null}

      {workflow ? (
        <>
          <section className="cr-summary" aria-labelledby="contract-title">
            <div className="cr-contract">
              <div className="cr-contract-line">
                <p className="cr-label">Active contract</p>
                <span className="cr-state" data-status={workflow.status}>
                  {workflow.status.replaceAll("_", " ")}
                </span>
              </div>
              <h2 id="contract-title">Hold {workflow.contract.candidateRevision} until checkout is healthy</h2>
              <p className="cr-source">Source: {workflow.contract.sourceMessageRef}</p>
            </div>
            <dl className="cr-facts">
              <div><dt>Resource</dt><dd>{workflow.contract.resourceId}</dd></div>
              <div><dt>Owner / approval</dt><dd>{workflow.contract.ownerId} · r{workflow.approval?.revision ?? "—"}</dd></div>
              <div><dt>Policy</dt><dd>≤ {workflow.contract.threshold} for {workflow.contract.windowMs / 1_000}s</dd></div>
              <div><dt>Execution gate</dt><dd>{executionGate(workflow.status)}</dd></div>
              <div><dt>Next</dt><dd>{lifecycleNext[workflow.status]}</dd></div>
              <div>
                <dt>Coordinator</dt>
                <dd className={snapshot.coordinator.connected ? "is-good" : "is-bad"}>
                  {snapshot.coordinator.connected ? "Connected" : "Unavailable"}
                  {snapshot.coordinator.reason ? ` · ${snapshot.coordinator.reason}` : ""}
                  {" · "}{snapshot.coordinator.lastSeenAt ? "Last seen " : "Status as of "}
                  <time dateTime={new Date(snapshot.coordinator.lastSeenAt ?? snapshot.asOf).toISOString()}>
                    {new Date(snapshot.coordinator.lastSeenAt ?? snapshot.asOf).toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC
                  </time>
                </dd>
              </div>
              <div>
                <dt>Slack listener</dt>
                <dd className={snapshot.listener.connected ? "is-good" : "is-stale"}>
                  {snapshot.listener.connected ? "Connected" : "Not connected"}
                  {snapshot.listener.reason ? ` · ${snapshot.listener.reason}` : ""}
                  {" · "}{snapshot.listener.lastSeenAt ? "Last seen " : "Status as of "}
                  <time dateTime={new Date(snapshot.listener.lastSeenAt ?? snapshot.asOf).toISOString()}>
                    {new Date(snapshot.listener.lastSeenAt ?? snapshot.asOf).toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC
                  </time>
                </dd>
              </div>
            </dl>
          </section>

          <div className="cr-grid">
            <section className="cr-card" aria-labelledby="health-title">
              <header className="cr-card-head">
                <div><p className="cr-label">Sustained condition</p><h2 id="health-title">Checkout health</h2></div>
                <strong>{workflow.observation?.value.toFixed(2) ?? "—"}</strong>
              </header>
              <figure>
                <svg className="cr-chart" viewBox="0 0 640 160" role="img" aria-labelledby="plot-title plot-desc">
                  <title id="plot-title">Checkout health observations</title>
                  <desc id="plot-desc">
                    Values must remain at or below {workflow.contract.threshold} for {workflow.contract.windowMs / 1_000} seconds.
                    {" "}{workflow.observation?.resets.length ?? 0} window resets are recorded.
                  </desc>
                  <line x1="24" x2="616" y1="24" y2="24" className="cr-gridline" />
                  <line x1="24" x2="616" y1="80" y2="80" className="cr-gridline" />
                  <line x1="24" x2="616" y1="136" y2="136" className="cr-gridline" />
                  <line x1="24" x2="616" y1={healthChartY(workflow.contract.threshold, chartDomain)} y2={healthChartY(workflow.contract.threshold, chartDomain)} className="cr-threshold" />
                  {resets.map((reset, index) => (
                    <g key={`${reset.at}-${index}`}>
                      <title>Window reset: {reset.reason}</title>
                      <line x1={chartX(reset.at)} x2={chartX(reset.at)} y1="20" y2="140" className="cr-reset" />
                      <circle cx={chartX(reset.at)} cy="20" r="4" className="cr-reset-marker" />
                    </g>
                  ))}
                  <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} className="cr-line" />
                  {points.map((sample) => {
                    return <circle key={sample.observedAt} cx={sample.x} cy={sample.y} r="5" className={sample.value <= workflow.contract.threshold ? "cr-point" : "cr-point cr-point--bad"} />;
                  })}
                </svg>
                <figcaption>
                  <span>Threshold ≤ {workflow.contract.threshold}</span>
                  <span>Window {workflow.contract.windowMs / 1_000}s</span>
                  <span>Elapsed {Math.floor(elapsed / 1_000)}s</span>
                  <span>{workflow.observation?.resets.length ?? 0} reset(s)</span>
                  {latestReset ? <span>Latest reset: {latestReset.reason}</span> : null}
                </figcaption>
              </figure>
              <p className="cr-muted">
                {lastSample ? (
                  <>Last sample <time dateTime={new Date(lastSample.observedAt).toISOString()}>{new Date(lastSample.observedAt).toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC</time>. </>
                ) : "No health samples recorded. "}
                Monitoring gaps reset elapsed evidence.
              </p>
            </section>

            <section className="cr-card" aria-labelledby="lifecycle-title">
              <p className="cr-label">Decision lifecycle</p>
              <h2 id="lifecycle-title">What happened, and what can happen next</h2>
              <ol className="cr-rail">
                {lifecycle.map((label, index) => (
                  <li key={label} data-state={index < lifecycleReached[workflow.status] ? "done" : index === lifecycleReached[workflow.status] ? "current" : "future"}>
                    <span aria-hidden="true">{index < lifecycleReached[workflow.status] ? "✓" : index + 1}</span>
                    <div><strong>{label}</strong><small>{index === lifecycleReached[workflow.status] ? lifecycleNext[workflow.status] : index < lifecycleReached[workflow.status] ? "Persisted" : "Not yet authorized"}</small></div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section className="cr-card cr-receipt" aria-labelledby="receipt-title">
            <div><p className="cr-label">Expected versus observed</p><h2 id="receipt-title">Verification receipt</h2></div>
            <dl className="cr-facts cr-facts--receipt">
              <div><dt>Expected revision</dt><dd>{workflow.contract.candidateRevision}</dd></div>
              <div><dt>Observed revision</dt><dd>{workflow.receipt?.observedRevision ?? workflow.verification?.observedRevision ?? "Pending"}</dd></div>
              <div><dt>Effective routing</dt><dd>{workflow.receipt ? `${workflow.receipt.trafficPercent}%` : workflow.verification ? `${workflow.verification.trafficPercent}%` : "Pending"}</dd></div>
              <div><dt>Operation</dt><dd><code>{workflow.operation?.id ?? "Not claimed"}</code></dd></div>
            </dl>
          </section>
        </>
      ) : (
        <section className="cr-card">
          <h2>{emptyState(snapshot.coordinator).title}</h2>
          <p>{emptyState(snapshot.coordinator).body}</p>
          <p className="cr-muted">
            Coordinator status checked <time dateTime={new Date(snapshot.asOf).toISOString()}>
              {new Date(snapshot.asOf).toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC
            </time>.
          </p>
        </section>
      )}
    </main>
  );
}
