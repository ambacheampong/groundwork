import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — Groundwork" },
      { name: "description", content: "Set a new password for your Groundwork account." },
      { property: "og:title", content: "Choose a new password — Groundwork" },
      { property: "og:description", content: "Set a new password for your Groundwork account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That reset link is no longer valid.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-2xl p-6">
        <Logo className="size-10" />
        <h1 className="mt-4 font-display text-2xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open this page from the reset link in your email, then set a new password.
        </p>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="new password"
          className="mt-5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
