import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const savePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ token: z.string(), platform: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_tokens")
      .upsert({ user_id: context.userId, token: data.token, platform: data.platform }, { onConflict: "user_id, token" });
    if (error) throw error;
    return { ok: true };
  });

export const removePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", context.userId)
      .eq("token", data.token);
    if (error) throw error;
    return { ok: true };
  });
