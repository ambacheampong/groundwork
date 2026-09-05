import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Eye, Trash2 } from "lucide-react";
import {
  adminListOrganisations,
  adminUpdateOrganisation,
  adminDeleteOrganisation,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/organisations")({
  component: OrgsAdmin,
});

function OrgsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-orgs"], queryFn: () => adminListOrganisations() });
  const upd = useMutation({
    mutationFn: (v: { id: string; patch: any }) => adminUpdateOrganisation({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orgs"] });
      toast.success("Saved.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteOrganisation({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orgs"] });
      toast.success("Deleted.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <AdminShell title="Organisations">
      <div className="mb-4 flex justify-end">
        <ExportMenu
          title="Organisations"
          rows={rows as any[]}
          columns={[
            { key: "name", label: "Name" },
            { key: "slug", label: "Slug" },
            { key: "website", label: "Website" },
            { key: "verified", label: "Verified" },
            { key: "views", label: "Visitors" },
          ]}
        />
      </div>
      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Website</th>
              <th className="px-3 py-2">Visitors</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.website ? (
                    <a href={r.website} target="_blank" rel="noreferrer" className="hover:underline">
                      {new URL(r.website).hostname}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-3 py-2"><span className="inline-flex items-center gap-1"><Eye className="size-3" />{r.views}</span></td>
                <td className="px-3 py-2">
                  {r.verified ? <Badge className="bg-primary text-primary-foreground">Verified</Badge> : <Badge variant="outline">—</Badge>}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      title={r.verified ? "Unverify" : "Verify"}
                      onClick={() => upd.mutate({ id: r.id, patch: { verified: !r.verified } })}
                    >
                      <CheckCircle2 className={`size-4 ${r.verified ? "text-primary" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-destructive"
                      title="Delete"
                      onClick={() => confirm("Delete this organisation?") && del.mutate(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
