import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/auth-recovery.functions";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — Groundwork" },
      { name: "description", content: "Request a password reset link for your Groundwork account." },
      { property: "og:title", content: "Reset your password — Groundwork" },
      { property: "og:description", content: "Request a password reset link for your Groundwork account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset({ data: { email, origin: window.location.origin } });
      setSent(true);
    } catch {
      toast.error("Couldn't send that right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl">
          <Logo className="size-10" />
          Groundwork
        </Link>
        <h1 className="mt-8 font-display text-3xl">Forgot your password.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Individual accounts can reset themselves. Organisation and admin accounts can't — a super
          admin has to trigger recovery for those.
        </p>

        {sent ? (
          <p className="glass mt-6 rounded-2xl p-4 text-sm">
            If that account is allowed to self-reset, a link is on its way. Organisation and admin
            accounts should contact a super admin.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link to="/auth" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
