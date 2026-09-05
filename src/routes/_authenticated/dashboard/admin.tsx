import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: () => (
    <AdminShell title="Admin dashboard">
      <p className="text-sm text-muted-foreground">Admin account. Full console below.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/admin" className="glass rounded-2xl p-5 hover:bg-muted/40">
          <div className="font-display text-lg">Console overview</div>
          <p className="mt-1 text-sm text-muted-foreground">Metrics, ingestion, moderation.</p>
        </Link>
        <Link to="/admin/accounts" className="glass rounded-2xl p-5 hover:bg-muted/40">
          <div className="font-display text-lg">Accounts & invites</div>
          <p className="mt-1 text-sm text-muted-foreground">Create accounts, change roles, issue invite codes, audit trail.</p>
        </Link>
        <Link to="/admin/verifications" className="glass rounded-2xl p-5 hover:bg-muted/40">
          <div className="font-display text-lg">Organisation verifications</div>
          <p className="mt-1 text-sm text-muted-foreground">Review documents, approve or reject orgs.</p>
        </Link>
      </div>
    </AdminShell>
  ),
});
