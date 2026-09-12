export async function POST() {
  return Response.json(
    { error: "The inherited voice route is disabled in Interlock." },
    { status: 404 },
  );
}
