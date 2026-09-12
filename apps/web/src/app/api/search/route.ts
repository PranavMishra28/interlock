export async function POST() {
  return Response.json(
    { error: "Arbitrary web search is disabled in Interlock." },
    { status: 404 },
  );
}
