import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import {
  adminListOpportunities,
  adminUpdateOpportunity,
  adminDeleteOpportunity,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/opportunities")({
  component: OpportunitiesAdmin,
});

function OpportunitiesAdmin() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-opps", search],
    queryFn: () => adminListOpportunities({ data: { search: search || undefined } }),
  });
  const upd = useMutation({
    mutationFn: (v: { id: string; patch: any }) => adminUpdateOpportunity({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-opps"] });
      toast.success("Updated.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteOpportunity({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-opps"] });
      toast.success("Deleted.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <AdminShell title="Opportunities">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          className="w-full max-w-sm rounded-xl"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ExportMenu
          title="Opportunities"
          rows={rows as any[]}
          columns={[
            { key: "title", label: "Title" },
            { key: "org", label: "Organisation", get: (r: any) => r.organisations?.name ?? "" },
            { key: "study_level", label: "Level" },
            { key: "funding_type", label: "Funding" },
            { key: "deadline_at", label: "Deadline" },
            { key: "featured", label: "Featured" },
            { key: "hidden_at", label: "Hidden" },
          ]}
        />
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Org</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Funding</th>
              <th className="px-3 py-2">Deadline</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{r.title}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.organisations?.name}</td>
                <td className="px-3 py-2"><Badge variant="outline">{r.study_level ?? "—"}</Badge></td>
                <td className="px-3 py-2">{r.funding_type ?? "—"}</td>
                <td className="px-3 py-2">{r.deadline_at ? new Date(r.deadline_at).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2">
                  {r.hidden_at ? <Badge variant="destructive">Hidden</Badge> : <Badge variant="secondary">Live</Badge>}
                  {r.featured && <Badge className="ml-1 bg-primary text-primary-foreground">Featured</Badge>}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      title={r.featured ? "Unfeature" : "Feature"}
                      onClick={() => upd.mutate({ id: r.id, patch: { featured: !r.featured } })}
                    >
                      <Star className={`size-4 ${r.featured ? "fill-primary text-primary" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      title={r.hidden_at ? "Show" : "Hide"}
                      onClick={() =>
                        upd.mutate({ id: r.id, patch: { hidden_at: r.hidden_at ? null : new Date().toISOString() } })
                      }
                    >
                      {r.hidden_at ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-destructive"
                      title="Delete"
                      onClick={() => confirm("Delete this opportunity permanently?") && del.mutate(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  Nothing here. Suspiciously quiet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
