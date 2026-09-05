import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { adminListIngestionRuns } from "@/lib/admin.functions";
import { triggerIngestion } from "@/lib/ingest.functions";

export const Route = createFileRoute("/_authenticated/admin/ingestion")({
  component: IngestionAdmin,
});

function IngestionAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-runs"], queryFn: () => adminListIngestionRuns() });
  const run = useMutation({
    mutationFn: () => triggerIngestion(),
    onSuccess: () => {
      toast.success("Ingestion started. Refresh in a minute.");
      qc.invalidateQueries({ queryKey: ["admin-runs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <AdminShell title="Ingestion">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every run of the Firecrawl + Gemini pipeline, most recent first.
        </p>
        <div className="flex gap-2">
          <Button className="rounded-xl" onClick={() => run.mutate()} disabled={run.isPending}>
            <RefreshCw className={`mr-2 size-4 ${run.isPending ? "animate-spin" : ""}`} />
            Refresh from web
          </Button>
          <ExportMenu
            title="Ingestion runs"
            rows={rows as any[]}
            columns={[
              { key: "started_at", label: "Started" },
              { key: "finished_at", label: "Finished" },
              { key: "status", label: "Status" },
              { key: "opportunities_added", label: "Added" },
              { key: "opportunities_updated", label: "Updated" },
              { key: "error", label: "Error" },
            ]}
          />
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Finished</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Added</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="px-3 py-2">{new Date(r.started_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={r.status === "success" ? "secondary" : r.status === "error" ? "destructive" : "outline"}>
                    {r.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">{r.opportunities_added ?? 0}</td>
                <td className="px-3 py-2">{r.opportunities_updated ?? 0}</td>
                <td className="px-3 py-2 max-w-md truncate text-muted-foreground">{r.error ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">No runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
