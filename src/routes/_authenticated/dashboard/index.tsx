import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyAccount } from "@/lib/account.functions";
import { LoadingScreen } from "@/components/LoadingScreen";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["my-account"], queryFn: () => getMyAccount(), retry: false });

  useEffect(() => {
    const a = q.data;
    if (!a) return;
    if (a.must_change_password) {
      navigate({ to: "/set-password", replace: true });
      return;
    }
    navigate({
      to: a.role === "admin" ? "/dashboard/admin" : a.role === "org" ? "/dashboard/org" : "/dashboard/user",
      replace: true,
    });
  }, [q.data, navigate]);

  return <LoadingScreen />;
}
