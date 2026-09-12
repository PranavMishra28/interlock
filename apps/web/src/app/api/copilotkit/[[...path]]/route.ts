const disabled = () =>
  Response.json(
    { error: "The inherited chat runtime is disabled in Interlock." },
    { status: 404 },
  );

export const GET = disabled;
export const POST = disabled;
export const OPTIONS = disabled;
