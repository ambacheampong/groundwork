import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyAccount } from "@/lib/account.functions";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/dashboard/org")({
  head: () => ({
    meta: [
      { title: "Organisation dashboard — Groundwork" },
      { name: "description", content: "Verification status and organisation tools for partner organisations." },
      { property: "og:title", content: "Organisation dashboard — Groundwork" },
      { property: "og:description", content: "Verification status and organisation tools for partner organisations." },
    ],
  }),
  component: OrgDashboard,
});

function OrgDashboard() {
  const q = useQuery({ queryKey: ["my-account"], queryFn: () => getMyAccount(), retry: false });
  const app = q.data?.orgApplication as any;
  const status: string = app?.status ?? "pending";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2 font-display text-base">
          <Logo className="size-7 rounded-lg" />
          Groundwork <span className="text-muted-foreground">· Organisation</span>
        </div>
        <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">
          Browse opportunities
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <h1 className="font-display text-3xl">{app?.org_name ?? "Your organisation"}</h1>
        <div className="mt-3">
          <Badge variant={status === "approved" ? "secondary" : status === "rejected" ? "destructive" : "outline"}>
            {status === "approved" ? "Verified" : status === "rejected" ? "Not verified" : "Pending verification"}
          </Badge>
        </div>
        <div className="glass mt-6 rounded-2xl p-5 text-sm text-muted-foreground">
          {status === "pending" &&
            "An admin is reviewing your verification document. Posting tools unlock once you're approved."}
          {status === "approved" && "You're verified. Your organisation profile is live in the directory."}
          {status === "rejected" && (app?.review_note || "Your application wasn't approved. Contact support to appeal.")}
        </div>
      </main>
    </div>
  );
}
