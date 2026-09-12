import {
  emptyState,
  fixtureStates,
  loadSnapshot,
  type FixtureState,
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

const reached: Record<string, number> = {
  PROPOSED: 1,
  ACTIVE_HOLD: 3,
  OBSERVING: 4,
  READY: 4,
  DISPATCHING: 6,
  NEEDS_INTERVENTION: 7,
  RETIRED: 8,
};

const next: Record<string, string> = {
  PROPOSED: "Await configured owner",
  ACTIVE_HOLD: "Observe fresh health",
  OBSERVING: "Complete sustained window",
  READY: "Claim exact promotion",
  DISPATCHING: "Read target state",
  NEEDS_INTERVENTION: "Operator resolution",
  RETIRED: "Retain receipt",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ fixture?: string }>;
}) {
  const requested = (await searchParams).fixture;
  const fixture: FixtureState = fixtureStates.includes(requested as FixtureState)
    ? requested as FixtureState
    : "observing";
  const snapshot = await loadSnapshot(fixture);
  const workflow = snapshot.workflow;
  const points = snapshot.samples.map((sample, index) => {
    const x = snapshot.samples.length === 1 ? 320 : 24 + index * (592 / (snapshot.samples.length - 1));
    const y = 136 - Math.min(2.2, sample.value) / 2.2 * 112;
    return `${x},${y}`;
  }).join(" ");
  const elapsed = workflow?.observation?.windowStartedAt
    ? workflow.observation.observedAt - workflow.observation.windowStartedAt
    : 0;

  return (
    <main className="cr-shell">
      <header className="cr-header">
        <div>
          <p className="ck-eyebrow">Interlock · Control Room</p>
          <h1>Checkout release constraint</h1>
          <p className="ck-intro">Evidence for one revision-bound operational decision.</p>
        </div>
        <span className="cr-mode" data-source={snapshot.source}>
          {snapshot.source === "synthetic" ? "TEST INPUT — SYNTHETIC" : "Coordinator data"}
        </span>
      </header>

      {snapshot.notice ? <p className="cr-alert" role="status">{snapshot.notice}</p> : null}

      {workflow ? (
        <>
          <section className="cr-summary" aria-labelledby="contract-title">
            <div>
              <p className="cr-label">Active contract</p>
              <h2 id="contract-title">Hold {workflow.contract.candidateRevision} until checkout is healthy</h2>
              <p className="cr-source">Source: {workflow.contract.sourceMessageRef}</p>
            </div>
            <dl className="cr-facts">
              <div><dt>Resource</dt><dd>{workflow.contract.resourceId}</dd></div>
              <div><dt>Owner / approval</dt><dd>{workflow.contract.ownerId} · r{workflow.approval?.revision ?? "—"}</dd></div>
              <div><dt>Current state</dt><dd><strong>{workflow.status.replaceAll("_", " ")}</strong></dd></div>
              <div><dt>Next</dt><dd>{next[workflow.status]}</dd></div>
              <div><dt>Coordinator</dt><dd className={snapshot.coordinator.connected ? "is-good" : "is-bad"}>{snapshot.coordinator.connected ? "Connected" : "Unavailable"}</dd></div>
              <div><dt>Slack listener</dt><dd className={snapshot.listener.connected ? "is-good" : "is-stale"}>{snapshot.listener.connected ? "Connected" : "Not connected"}</dd></div>
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
                  <desc id="plot-desc">Values must remain at or below {workflow.contract.threshold} for {workflow.contract.windowMs / 1_000} seconds. The first sample reset the window.</desc>
                  <line x1="24" x2="616" y1="85" y2="85" className="cr-threshold" />
                  <polyline points={points} className="cr-line" />
                  {snapshot.samples.map((sample, index) => {
                    const [x, y] = points.split(" ")[index]!.split(",");
                    return <circle key={sample.observedAt} cx={x} cy={y} r="5" className={sample.value <= workflow.contract.threshold ? "cr-point" : "cr-point cr-point--bad"} />;
                  })}
                </svg>
                <figcaption>
                  Threshold ≤ {workflow.contract.threshold} · required window {workflow.contract.windowMs / 1_000}s · elapsed {Math.floor(elapsed / 1_000)}s · {workflow.observation?.resets.length ?? 0} reset(s)
                </figcaption>
              </figure>
              <p className="cr-muted">Last sample <time>{new Date(workflow.observation?.observedAt ?? snapshot.asOf).toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC</time>. Monitoring gaps reset elapsed evidence.</p>
            </section>

            <section className="cr-card" aria-labelledby="lifecycle-title">
              <p className="cr-label">Decision lifecycle</p>
              <h2 id="lifecycle-title">What happened, and what can happen next</h2>
              <ol className="cr-rail">
                {lifecycle.map((label, index) => (
                  <li key={label} data-state={index < reached[workflow.status] ? "done" : index === reached[workflow.status] ? "current" : "future"}>
                    <span aria-hidden="true">{index < reached[workflow.status] ? "✓" : index + 1}</span>
                    <div><strong>{label}</strong><small>{index === reached[workflow.status] ? next[workflow.status] : index < reached[workflow.status] ? "Persisted" : "Not yet authorized"}</small></div>
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
        </section>
      )}
    </main>
  );
}
