import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  adminListAllowlist,
  adminAddAllowlist,
  adminRemoveAllowlist,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/allowlist")({
  component: AllowlistAdmin,
});

function AllowlistAdmin() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const q = useQuery({ queryKey: ["admin-allowlist"], queryFn: () => adminListAllowlist() });
  const add = useMutation({
    mutationFn: (e: string) => adminAddAllowlist({ data: { email: e } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-allowlist"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      toast.success("Added. They'll be promoted on next verified sign-in.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const rm = useMutation({
    mutationFn: (e: string) => adminRemoveAllowlist({ data: { email: e } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-allowlist"] });
      toast.success("Removed. Existing admin role is unchanged.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = q.data ?? [];

  return (
    <AdminShell title="Admin allowlist">
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Emails on this list are auto-granted the <code>admin</code> role the moment they sign up and
        verify. Removing an email here does not revoke existing admins — do that on the Users page.
      </p>

      <div className="glass-strong flex flex-wrap items-end gap-2 rounded-2xl p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <Button
          className="rounded-xl"
          disabled={!email || add.isPending}
          onClick={() => add.mutate(email)}
        >
          <Plus className="mr-2 size-4" /> Add
        </Button>
      </div>

      <div className="mt-6 glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Added</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.email} className="border-t border-border/40">
                <td className="px-3 py-2 font-medium">{r.email}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-lg text-destructive"
                    onClick={() => rm.mutate(r.email)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-10 text-center text-muted-foreground">Empty. Add your email to bootstrap the first admin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
