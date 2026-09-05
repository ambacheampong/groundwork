import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw redirect({ to: "/auth" });
    const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userRes.user.id, _role: "admin" }),
      supabase.rpc("is_super_admin", { _user_id: userRes.user.id }),
    ]);
    if (!isAdmin && !isSuper) throw redirect({ to: "/feed" });
  },
  component: () => <Outlet />,
});
