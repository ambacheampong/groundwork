import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, KeyRound, Trash2, UserX, UserCheck, MailWarning, RefreshCw, Check, X } from "lucide-react";
import {
  getAdminLevel,
  adminListAccounts,
  adminCreateAccount,
  adminSetAccountRole,
  adminSetAccountStatus,
  adminDeleteAccount,
  adminResetPasswordForAccount,
  adminSendRecoveryLink,
  adminRotateRecoveryReference,
  adminListInvites,
  adminCreateInvite,
  adminReviewInvite,
  adminRevokeInvite,
  adminListAuditLog,
} from "@/lib/admin-accounts.functions";

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts & invites — Groundwork admin" },
      { name: "description", content: "Create accounts, assign roles, issue invite codes and review the audit trail." },
      { property: "og:title", content: "Accounts & invites — Groundwork admin" },
      { property: "og:description", content: "Create accounts, assign roles, issue invite codes and review the audit trail." },
    ],
  }),
  component: AccountsAdmin,
});

const BASE_ROLES = ["user", "org"] as const;
const ALL_ROLES = ["user", "org", "admin", "super_admin"] as const;
type Role = (typeof ALL_ROLES)[number];

function useLevel() {
  const q = useQuery({ queryKey: ["admin-level"], queryFn: () => getAdminLevel(), staleTime: 60_000 });
  return { superAdmin: Boolean(q.data?.superAdmin) };
}

function AccountsAdmin() {
  const { superAdmin } = useLevel();
  return (
    <AdminShell title="Accounts & invites">
      <p className="mb-4 text-sm text-muted-foreground">
        You're signed in as {superAdmin ? "a super admin — full control." : "a regular admin. Admin accounts, password recovery and invite approvals are super admin territory."}
      </p>
      <Tabs defaultValue="accounts">
        <TabsList className="rounded-xl">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="invites">Invite codes</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-4">
          <AccountsTab superAdmin={superAdmin} />
        </TabsContent>
        <TabsContent value="invites" className="mt-4">
          <InvitesTab superAdmin={superAdmin} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function AccountsTab({ superAdmin }: { superAdmin: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-accounts"], queryFn: () => adminListAccounts() });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [search, setSearch] = useState("");

  const roles: readonly Role[] = superAdmin ? ALL_ROLES : BASE_ROLES;

  const done = (msg: string) => {
    qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    qc.invalidateQueries({ queryKey: ["admin-audit"] });
    toast.success(msg);
  };
  const fail = (e: any) => toast.error(e?.message ?? "That didn't work.");

  const create = useMutation({
    mutationFn: () =>
      adminCreateAccount({ data: { email, password, role, display_name: displayName || undefined } }),
    onSuccess: (res: any) => {
      setEmail("");
      setPassword("");
      setDisplayName("");
      done(`Account created. Recovery reference: ${res.recovery_reference} — pass it on, it won't be shown again.`);
    },
    onError: fail,
  });
  const setRoleM = useMutation({
    mutationFn: (v: { user_id: string; role: Role }) => adminSetAccountRole({ data: v }),
    onSuccess: () => done("Role updated."),
    onError: fail,
  });
  const setStatus = useMutation({
    mutationFn: (v: { user_id: string; suspended: boolean }) => adminSetAccountStatus({ data: v }),
    onSuccess: () => done("Status updated."),
    onError: fail,
  });
  const del = useMutation({
    mutationFn: (v: { user_id: string }) => adminDeleteAccount({ data: v }),
    onSuccess: () => done("Account deleted."),
    onError: fail,
  });
  const resetPw = useMutation({
    mutationFn: (v: { user_id: string; password: string }) => adminResetPasswordForAccount({ data: v }),
    onSuccess: () => done("Temporary password set. They must change it on next sign-in."),
    onError: fail,
  });
  const sendLink = useMutation({
    mutationFn: (v: { user_id: string }) =>
      adminSendRecoveryLink({ data: { ...v, origin: window.location.origin } }),
    onSuccess: () => done("Recovery link emailed."),
    onError: fail,
  });
  const rotate = useMutation({
    mutationFn: (v: { user_id: string }) => adminRotateRecoveryReference({ data: v }),
    onSuccess: (res: any) => done(`New recovery reference: ${res.recovery_reference}`),
    onError: fail,
  });

  const rows = (q.data ?? []).filter((a: any) =>
    !search ? true : (a.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="font-display text-lg">Create an account</div>
        <p className="mt-1 text-sm text-muted-foreground">
          They must confirm their email and change this password before they can use it.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input className="rounded-xl sm:col-span-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input className="rounded-xl" placeholder="display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input className="rounded-xl" placeholder="temporary password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-input bg-background px-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Button className="rounded-xl" disabled={create.isPending || !email || password.length < 8} onClick={() => create.mutate()}>
              Add
            </Button>
          </div>
        </div>
      </div>

      <Input
        className="w-full max-w-sm rounded-xl"
        placeholder="Search email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              {superAdmin ? <th className="px-3 py-2">Recovery ref.</th> : null}
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a: any) => {
              const elevated = a.role === "admin" || a.role === "super_admin";
              const canManage = superAdmin || !elevated;
              return (
                <tr key={a.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">
                    {a.email}
                    {a.must_change_password ? (
                      <Badge variant="outline" className="ml-2">must reset</Badge>
                    ) : null}
                    {!a.email_verified ? (
                      <Badge variant="outline" className="ml-2">unverified</Badge>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={a.role}
                      disabled={!canManage}
                      onChange={(e) => setRoleM.mutate({ user_id: a.id, role: e.target.value as Role })}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {(superAdmin ? ALL_ROLES : [...BASE_ROLES, a.role as Role]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {a.status === "suspended" ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : a.status === "active" ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </td>
                  {superAdmin ? (
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground" title="Reference code hint — never a password">
                      {a.recovery_hint_masked ?? "—"}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-muted-foreground">
                    {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      {superAdmin ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg"
                            title="Email a secure reset link"
                            onClick={() => sendLink.mutate({ user_id: a.id })}
                          >
                            <MailWarning className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg"
                            title="Set temporary password"
                            onClick={() => {
                              const pw = window.prompt("New temporary password (min 8 characters)");
                              if (pw && pw.length >= 8) resetPw.mutate({ user_id: a.id, password: pw });
                            }}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg"
                            title="Rotate recovery reference"
                            onClick={() => rotate.mutate({ user_id: a.id })}
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg"
                        disabled={!canManage}
                        title={a.status === "suspended" ? "Restore" : "Suspend"}
                        onClick={() => setStatus.mutate({ user_id: a.id, suspended: a.status !== "suspended" })}
                      >
                        {a.status === "suspended" ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg text-destructive"
                        disabled={!canManage}
                        title="Delete account"
                        onClick={() => {
                          if (window.confirm(`Delete ${a.email}? This can't be undone.`)) del.mutate({ user_id: a.id });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvitesTab({ superAdmin }: { superAdmin: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-invites"], queryFn: () => adminListInvites() });
  const [role, setRole] = useState<Role>("org");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);

  const roles: readonly Role[] = superAdmin ? ALL_ROLES : BASE_ROLES;

  const create = useMutation({
    mutationFn: () => adminCreateInvite({ data: { role, email: email || "", expires_in_days: days } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      navigator.clipboard?.writeText(res.code).catch(() => {});
      toast.success(
        res.status === "pending"
          ? `Invite ${res.code} created — inactive until a super admin approves it.`
          : `Invite ${res.code} created and copied.`,
      );
      setEmail("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't create the invite."),
  });
  const revoke = useMutation({
    mutationFn: (v: { id: string }) => adminRevokeInvite({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Invite revoked.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't revoke."),
  });
  const review = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => adminReviewInvite({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
      toast.success("Invite reviewed.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't review that invite."),
  });

  const state = (i: any) =>
    i.status === "pending"
      ? "pending approval"
      : i.status === "rejected"
        ? "rejected"
        : i.used_at
          ? "used"
          : i.revoked_at
            ? "revoked"
            : new Date(i.expires_at) < new Date()
              ? "expired"
              : "active";

  const all = (q.data ?? []) as any[];
  const pending = all.filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="font-display text-lg">Generate an invite code</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Single-use, expires automatically, optional email lock.
          {superAdmin ? "" : " Yours stay inactive until a super admin approves them."}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-xl border border-input bg-background px-2 py-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Input className="rounded-xl" placeholder="lock to email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            className="rounded-xl"
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <Button className="rounded-xl" disabled={create.isPending} onClick={() => create.mutate()}>
            Generate
          </Button>
        </div>
      </div>

      {superAdmin && pending.length > 0 ? (
        <div className="glass rounded-2xl p-5">
          <div className="font-display text-lg">Pending super admin approval</div>
          <div className="mt-3 space-y-2">
            {pending.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 p-3 text-sm">
                <div>
                  <span className="font-mono">{i.code}</span>
                  <span className="ml-2 text-muted-foreground">
                    role {i.role} · expires {new Date(i.expires_at).toLocaleDateString()} · created by{" "}
                    {String(i.created_by ?? "").slice(0, 8)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-lg" onClick={() => review.mutate({ id: i.id, approve: true })}>
                    <Check className="mr-1 size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => review.mutate({ id: i.id, approve: false })}>
                    <X className="mr-1 size-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {all.map((i: any) => {
              const s = state(i);
              return (
                <tr key={i.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono">{i.code}</td>
                  <td className="px-3 py-2">{i.role}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.email ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(i.expires_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <Badge variant={s === "active" ? "secondary" : s === "used" || s === "pending approval" ? "outline" : "destructive"}>
                      {s}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-lg"
                        title="Copy code"
                        onClick={() => {
                          navigator.clipboard?.writeText(i.code);
                          toast.success("Copied.");
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                      {s === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-destructive"
                          onClick={() => revoke.mutate({ id: i.id })}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => adminListAuditLog() });
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Admin</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Target</th>
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((r: any) => (
            <tr key={r.id} className="border-t border-border/40">
              <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              <td className="px-3 py-2">{r.actor_email ?? r.actor_id?.slice(0, 8)}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {r.target_type ? `${r.target_type}: ${String(r.target_id ?? "").slice(0, 24)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
