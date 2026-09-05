import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { adminListPosts, adminHidePost, adminDeletePost } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/community")({
  component: CommunityAdmin,
});

function CommunityAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-posts"], queryFn: () => adminListPosts() });
  const hide = useMutation({
    mutationFn: (v: { id: string; hide: boolean }) => adminHidePost({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Done.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeletePost({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Deleted.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <AdminShell title="Community moderation">
      <div className="mb-4 flex justify-end">
        <ExportMenu
          title="Community posts"
          rows={rows as any[]}
          columns={[
            { key: "title", label: "Title" },
            { key: "community", label: "Community", get: (r: any) => r.communities?.name ?? "" },
            { key: "author", label: "Author", get: (r: any) => r.profiles?.display_name ?? "" },
            { key: "created_at", label: "Posted" },
            { key: "hidden_at", label: "Hidden" },
          ]}
        />
      </div>
      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Community</th>
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{r.title ?? "(untitled)"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.communities?.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.profiles?.display_name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  {r.hidden_at ? <Badge variant="destructive">Hidden</Badge> : <Badge variant="secondary">Live</Badge>}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      title={r.hidden_at ? "Show" : "Hide"}
                      onClick={() => hide.mutate({ id: r.id, hide: !r.hidden_at })}
                    >
                      {r.hidden_at ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-destructive"
                      title="Delete"
                      onClick={() => confirm("Delete this post?") && del.mutate(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  Nothing to moderate. Suspiciously well-behaved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
