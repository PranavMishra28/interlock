"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="cr-shell">
      <section className="cr-card">
        <p className="cr-label">Control Room unavailable</p>
        <h1>Evidence could not be displayed</h1>
        <p>
          The current coordinator and workflow state are unknown. Retry the
          evidence view before making an operational decision.
        </p>
        <button className="ck-btn" type="button" onClick={reset}>Retry</button>
      </section>
    </main>
  );
}
