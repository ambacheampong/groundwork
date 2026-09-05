import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/ingest-opportunities")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || !apiKey || apiKey !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        const { runIngestion } = await import("@/lib/ingest.server");
        const result = await runIngestion();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
