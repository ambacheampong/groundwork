import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearForcedPasswordReset } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/set-password")({
  component: SetPassword,
});

function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await clearForcedPasswordReset();
      toast.success("Password set.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't set the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-2xl p-6">
        <h1 className="font-display text-2xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account was created by an admin. Set your own password before continuing.
        </p>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="new password"
          className="mt-5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
