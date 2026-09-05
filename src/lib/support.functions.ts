import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ticketSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(120).optional().nullable(),
  topic: z.enum(["account", "listing", "organisation", "bug", "privacy", "other"]),
  subject: z.string().trim().min(4).max(180),
  message: z.string().trim().min(10).max(4000),
});

/** Public: anyone can raise a support request, signed in or not. */
export const submitSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ticketSchema.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        email: data.email.toLowerCase(),
        name: data.name || null,
        topic: data.topic,
        subject: data.subject,
        message: data.message,
      } as any)
      .select("reference")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, reference: (row as any)?.reference as string };
  });

/** The signed-in user's own tickets. */
export const listMySupportRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = ((context.claims as any)?.email as string | undefined)?.toLowerCase();
    if (!email) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("support_tickets")
      .select("reference, topic, subject, status, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data ?? []) as any[];
  });
