import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { buildGreeting } from "@/lib/greetings";

// Re-engagement notifications for users who have been away.
// Called by a scheduled job with the project's anon key in the `apikey` header.
export const Route = createFileRoute("/api/public/hooks/reengage")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        if (!key || key !== process.env["SUPABASE_ANON_KEY"]) {
          return new Response("Unauthorized", { status: 401 });
        }

        const admin = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
          { auth: { persistSession: false } },
        );

        const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
        const { data: users, error } = await admin
          .from("profiles")
          .select("id, display_name, first_name, app_language, last_active_at")
          .not("privacy_consent_at", "is", null)
          .is("deleted_at", null)
          .lt("last_active_at", cutoff)
          .limit(500);

        if (error) return new Response(error.message, { status: 500 });

        const rows = (users ?? []).map((u, i) => {
          const g = buildGreeting({
            language: u.app_language,
            name: u.first_name ?? u.display_name,
            seed: Date.now() + i,
          });
          return {
            user_id: u.id,
            kind: "opportunity" as const,
            title: g.title,
            body: g.body,
            link: "/feed",
          };
        });

        if (rows.length) {
          const { error: insErr } = await admin.from("notifications").insert(rows);
          if (insErr) return new Response(insErr.message, { status: 500 });
        }

        return Response.json({ notified: rows.length });
      },
    },
  },
});
