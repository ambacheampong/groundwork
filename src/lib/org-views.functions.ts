import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const recordOrgView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ orgId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase
      .from("organisation_views")
      .insert({ org_id: data.orgId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOrgViewCounts = createServerFn({ method: "GET" })
  .handler(async () => {
    // The RPC is no longer executable by anon/authenticated; run it server-side only.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_org_view_counts");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ org_id: string; view_count: number }>;
  });
