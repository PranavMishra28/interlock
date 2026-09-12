export default function Loading() {
  return (
    <main className="cr-shell" aria-busy="true">
      <p className="ck-sr-only" role="status">
        Loading current operational evidence.
      </p>
      <header className="cr-header">
        <div>
          <p className="ck-eyebrow">Operational constraint · Checkout</p>
          <h1>Checkout release constraint</h1>
          <p className="ck-intro">
            One decision. One authority boundary. Independently verified.
          </p>
        </div>
        <span className="cr-mode cr-placeholder" aria-hidden="true">
          Loading local state
        </span>
      </header>

      <section className="cr-summary cr-loading-summary" aria-hidden="true">
        <div className="cr-skeleton">
          <span />
          <span />
          <span />
        </div>
        <div className="cr-skeleton">
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="cr-grid cr-loading-grid" aria-hidden="true">
        <section className="cr-card cr-skeleton">
          <span />
          <span />
          <span className="cr-skeleton-block" />
        </section>
        <section className="cr-card cr-skeleton">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </section>
      </div>

      <section className="cr-card cr-receipt cr-loading-receipt" aria-hidden="true">
        <div className="cr-skeleton">
          <span />
          <span />
        </div>
        <div className="cr-skeleton">
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}
