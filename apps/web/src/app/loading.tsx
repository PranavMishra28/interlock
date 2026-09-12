export default function Loading() {
  return (
    <main className="cr-shell" aria-busy="true">
      <header className="cr-header">
        <div>
          <p className="ck-eyebrow">Operational constraint · Checkout</p>
          <h1>Loading current evidence…</h1>
          <p className="ck-intro">Connecting to the local authority boundary.</p>
        </div>
      </header>
      <section className="cr-card cr-loading" aria-label="Loading decision state">
        <span />
        <span />
        <span />
      </section>
    </main>
  );
}
