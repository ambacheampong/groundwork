import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { ExportMenu } from "@/components/ExportMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ShieldOff, UserX, UserCheck } from "lucide-react";
import {
  adminListUsers,
  adminSetRole,
  adminSoftDeleteUser,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => adminListUsers() });
  const role = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "moderator" | "user"; grant: boolean }) =>
      adminSetRole({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const softDel = useMutation({
    mutationFn: (v: { user_id: string; restore?: boolean }) => adminSoftDeleteUser({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Done.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const all = q.data ?? [];
  const rows = all.filter((u) =>
    !search ? true : u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminShell title="Users & roles">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Input
          className="w-full max-w-sm rounded-xl"
          placeholder="Search email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ExportMenu
          title="Users"
          rows={rows as any[]}
          columns={[
            { key: "email", label: "Email" },
            { key: "confirmed", label: "Confirmed" },
            { key: "roles", label: "Roles", get: (r: any) => (r.roles ?? []).join(",") },
            { key: "created_at", label: "Created" },
          ]}
        />
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isAdmin = u.roles.includes("admin");
              const banned = Boolean(u.profile?.banned_at || u.profile?.deleted_at);
              return (
                <tr key={u.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{u.email}</td>
                  <td className="px-3 py-2">
                    {u.roles.length ? u.roles.map((r) => (
                      <Badge key={r} variant="outline" className="mr-1">{r}</Badge>
                    )) : <span className="text-muted-foreground">user</span>}
                  </td>
                  <td className="px-3 py-2">
                    {banned ? <Badge variant="destructive">Suspended</Badge> : u.confirmed ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Pending</Badge>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg"
                        title={isAdmin ? "Revoke admin" : "Grant admin"}
                        onClick={() => role.mutate({ user_id: u.id, role: "admin", grant: !isAdmin })}
                      >
                        {isAdmin ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-destructive"
                        title={banned ? "Restore" : "Suspend"}
                        onClick={() => softDel.mutate({ user_id: u.id, restore: banned })}
                      >
                        {banned ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
