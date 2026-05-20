// Liveness probe — must return 200 OK with no auth gate.
// Used by hosting platform health checks (Railway, etc).

export const dynamic = "force-static";

export function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "filesante-web",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    },
  );
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
