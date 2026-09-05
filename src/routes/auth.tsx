import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { voice } from "@/lib/voice";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { User, Building2, ShieldCheck, ArrowLeft, Upload, MailCheck } from "lucide-react";
import { submitOrgApplication, redeemInvite, getOrCreateRecoveryReference } from "@/lib/account.functions";
import { resendVerificationEmail } from "@/lib/auth-recovery.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Groundwork" },
      { name: "description", content: "Sign in or create a Groundwork account." },
    ],
  }),
  component: AuthPage,
});

type Kind = "user" | "org";
const ORG_TYPES = ["company", "ngo", "government", "academic", "foundation"] as const;

const field =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [kind, setKind] = useState<Kind | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgType, setOrgType] = useState<(typeof ORG_TYPES)[number]>("company");
  const [website, setWebsite] = useState("");
  const [doc, setDoc] = useState<File | null>(null);
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const isSignIn = mode === "signin";

  const ORG_STASH = "gw:pending-org-application";

  const afterAuth = async () => {
    if (invite.trim()) {
      try {
        await redeemInvite({ data: { code: invite.trim() } });
        toast.success("Invite redeemed.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "That invite code didn't work.");
      }
    }

    // An organisation that signed up before confirming its email submits now.
    const stash = window.localStorage.getItem(ORG_STASH);
    if (stash) {
      try {
        await submitOrgApplication({ data: JSON.parse(stash) });
        window.localStorage.removeItem(ORG_STASH);
        toast.success("Application submitted. Verification is pending review.");
      } catch {
        window.localStorage.removeItem(ORG_STASH);
      }
    }
    navigate({ to: "/dashboard" });
  };

  const resend = async () => {
    if (!awaitingVerification) return;
    try {
      await resendVerificationEmail({
        data: { email: awaitingVerification, origin: window.location.origin },
      });
      toast.success("Confirmation email sent again.");
    } catch {
      toast.error("Couldn't resend that. Try again in a minute.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/confirm/i.test(error.message)) {
            setAwaitingVerification(email);
            return;
          }
          throw error;
        }
        await afterAuth();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth",
          data: { full_name: name || email.split("@")[0] },
        },
      });
      if (error) throw error;

      if (kind === "org") {
        let document_path: string | null = null;
        if (data.session && doc) {
          const path = `${data.user!.id}/${Date.now()}-${doc.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const up = await supabase.storage.from("org-docs").upload(path, doc);
          if (up.error) throw new Error(up.error.message);
          document_path = path;
        }
        const payload = {
          org_name: name,
          org_type: orgType,
          official_email: email,
          website: website || null,
          document_path,
        };
        if (data.session) {
          await submitOrgApplication({ data: payload });
          toast.success("Application submitted. Verification is pending review.");
        } else {
          window.localStorage.setItem(ORG_STASH, JSON.stringify(payload));
        }
      }

      if (!data.session) {
        setAwaitingVerification(email);
        return;
      }

      try {
        const ref = await getOrCreateRecoveryReference();
        setReference(ref.recovery_reference);
      } catch {
        /* non-fatal */
      }

      await afterAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something didn't work.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    // supabase-js redirects the browser to Google itself; on return, Supabase's
    // auth listener picks up the session, so there's nothing to do after this call
    // succeeds other than let the redirect happen.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      toast.error("Google sign-in failed.");
    }
  };

  if (awaitingVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="glass w-full max-w-sm rounded-2xl p-6">
          <MailCheck className="size-8 text-primary" />
          <h1 className="mt-4 font-display text-xl sm:text-2xl">Verify your email.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{awaitingVerification}</span>.
            Click it, then come back and sign in. Nothing works until you do.
          </p>
          {reference ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm">
              Your recovery reference: <span className="font-mono">{reference}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Save it. It's not your password — it's how a super admin confirms who you are.
              </span>
            </p>
          ) : null}
          <button
            onClick={resend}
            className="mt-5 w-full rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted"
          >
            Resend the email
          </button>
          <button
            onClick={() => {
              setAwaitingVerification(null);
              setMode("signin");
            }}
            className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 font-display text-xl sm:text-2xl">
          <Logo className="size-9 sm:size-10" />
          Groundwork
        </Link>

        {!isSignIn && kind === null ? (
          <div className="mt-8">
            <h1 className="font-display text-2xl sm:text-3xl">I am signing up as…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pick one. It decides what you'll see.</p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setKind("user")}
                className="glass flex w-full items-start gap-3 rounded-2xl p-4 text-left transition hover:bg-muted/40"
              >
                <User className="mt-0.5 size-5 text-primary" />
                <span>
                  <span className="block font-medium">User</span>
                  <span className="block text-sm text-muted-foreground">
                    An individual looking for scholarships, fellowships and jobs.
                  </span>
                </span>
              </button>
              <button
                onClick={() => setKind("org")}
                className="glass flex w-full items-start gap-3 rounded-2xl p-4 text-left transition hover:bg-muted/40"
              >
                <Building2 className="mt-0.5 size-5 text-primary" />
                <span>
                  <span className="block font-medium">Organization</span>
                  <span className="block text-sm text-muted-foreground">
                    Post opportunities. Requires verification before you're listed.
                  </span>
                </span>
              </button>
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4 text-left opacity-70">
                <ShieldCheck className="mt-0.5 size-5" />
                <span>
                  <span className="block font-medium">Admin</span>
                  <span className="block text-sm text-muted-foreground">
                    Admin accounts are created by invitation only.
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setMode("signin")}
              className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Already have one? Sign in.
            </button>
          </div>
        ) : (
          <>
            {!isSignIn ? (
              <button
                onClick={() => setKind(null)}
                className="mt-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Change role
              </button>
            ) : null}

            <h1 className="mt-4 font-display text-2xl sm:text-3xl">
              {isSignIn
                ? voice.auth.signInTitle
                : kind === "org"
                  ? "Register your organisation."
                  : voice.auth.signUpTitle}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignIn
                ? voice.auth.signInSub
                : kind === "org"
                  ? "We verify every organisation before it appears in the directory."
                  : voice.auth.signUpSub}
            </p>

            <button
              onClick={onGoogle}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {!isSignIn ? (
                <input
                  placeholder={kind === "org" ? "organisation name" : "full name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  className={field}
                />
              ) : null}

              {!isSignIn && kind === "org" ? (
                <>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as (typeof ORG_TYPES)[number])}
                    className={field}
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="website (optional)"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={255}
                    className={field}
                  />
                </>
              ) : null}

              <input
                type="email"
                placeholder={!isSignIn && kind === "org" ? "official email" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={field}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={field}
              />

              {!isSignIn && kind === "org" ? (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/40">
                  <Upload className="size-4" />
                  <span className="truncate">{doc ? doc.name : "Verification document (PDF or image)"}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
                  />
                </label>
              ) : null}

              <input
                placeholder="invite code (optional)"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                maxLength={64}
                className={field}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "…" : isSignIn ? "Sign in" : kind === "org" ? "Submit for verification" : "Create account"}
              </button>
            </form>

            {isSignIn ? (
              <Link
                to="/forgot-password"
                className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot your password?
              </Link>
            ) : null}



            <button
              onClick={() => {
                setMode(isSignIn ? "signup" : "signin");
                setKind(null);
              }}
              className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignIn ? "No account yet? Make one." : "Already have one? Sign in."}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
