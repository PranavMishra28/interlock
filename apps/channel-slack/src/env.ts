export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      [
        `Missing required environment variable: ${name}.`,
        "",
        "  Run `npm run check-env` from the repo root to see everything that's missing,",
        "  or follow the live capability gate in `docs/RUNBOOK.md`.",
      ].join("\n"),
    );
  }
  return value;
}
