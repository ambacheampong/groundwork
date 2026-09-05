import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { acceptPrivacyConsent } from "@/lib/engagement.functions";
import { updateMyProfile } from "@/lib/user.functions";
import { CountrySelect } from "@/components/CountrySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/greetings";
import { voice } from "@/lib/voice";
import { toast } from "sonner";
import { Camera, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Get started — Groundwork" },
      {
        name: "description",
        content:
          "Set up your Groundwork account: privacy consent, then a handful of essentials so the feed stops guessing.",
      },
      { property: "og:title", content: "Get started — Groundwork" },
      {
        property: "og:description",
        content: "Privacy consent and a few essentials. Two minutes, no more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];
const LEVELS = [
  { v: "secondary", l: "Secondary" },
  { v: "undergraduate", l: "Undergraduate" },
  { v: "graduate", l: "Graduate" },
  { v: "postgraduate", l: "Postgraduate" },
  { v: "professional", l: "Working professional" },
];

type Step = "consent" | "declined" | "essentials";

function Onboarding() {
  const navigate = useNavigate();
  const consent = useServerFn(acceptPrivacyConsent);
  const update = useServerFn(updateMyProfile);

  const [step, setStep] = useState<Step>("consent");
  const [language, setLanguage] = useState("en");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    country: "",
    gender: "",
    date_of_birth: "",
    education_level: "",
    field_of_study: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);

  async function agree() {
    setSaving(true);
    try {
      await consent({ data: { language } });
      setStep("essentials");
    } catch (e) {
      toast.error((e as Error).message || "Could not record consent.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      setAvatarPath(path);
      toast.success("Photo added.");
    } catch (e) {
      toast.error((e as Error).message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await update({
        data: {
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          display_name:
            `${form.first_name} ${form.last_name}`.trim() || null,
          country: form.country || null,
          gender: form.gender || null,
          date_of_birth: form.date_of_birth || null,
          education_level: (form.education_level || null) as never,
          field_of_study: form.field_of_study || null,
          avatar_path: avatarPath,
          app_language: language,
          onboarded: true,
        },
      });
      navigate({ to: "/feed", replace: true });
    } catch (e) {
      toast.error((e as Error).message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
      {step === "consent" && (
        <section className="glass-strong animate-float-in space-y-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <h1 className="font-display text-2xl sm:text-3xl">Before we go further</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Groundwork needs a little data to be useful. Here's the whole of it:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Who you are</strong> — name, nationality, gender,
              date of birth and photo, so your profile is yours and applications aren't anonymous.
            </li>
            <li>
              <strong className="text-foreground">What you study or do</strong> — education level
              and programme, used to filter out opportunities you'd be ineligible for.
            </li>
            <li>
              <strong className="text-foreground">Activity in the app</strong> — saves, tracked
              organisations and last active time, used to rank your feed and send reminders.
            </li>
            <li>
              <strong className="text-foreground">Account basics</strong> — email and sign-in
              records, used for security and password recovery.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We do not sell your data or hand it to advertisers. You can edit or delete your profile
            at any time from the Profile tab.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Notification language
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={agree} disabled={saving} className="rounded-2xl sm:flex-1">
              {saving ? "One moment…" : "Agree and continue"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep("declined")}
              className="rounded-2xl sm:flex-1"
            >
              Disagree
            </Button>
          </div>
        </section>
      )}

      {step === "declined" && (
        <section className="glass-strong animate-float-in space-y-4 rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-2xl sm:text-3xl">Then we can't continue.</h1>
          <p className="text-sm text-muted-foreground">
            Groundwork can't run without the data listed on the previous screen — matching you to
            opportunities requires knowing something about you. Nothing further is unlocked until
            you agree.
          </p>
          <p className="text-sm text-muted-foreground">
            Review the summary again, or sign out and come back whenever you like.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setStep("consent")} className="rounded-2xl sm:flex-1">
              Review and agree
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl sm:flex-1"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </section>
      )}

      {step === "essentials" && (
        <section className="glass-strong animate-float-in space-y-5 rounded-3xl p-6 sm:p-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl">{voice.onboarding.welcome}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Six things. Everything else lives in your profile and can wait.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-muted-foreground"
              aria-label="Add profile picture"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : avatarPath ? (
                <span className="text-xs">Added</span>
              ) : (
                <Camera className="size-5" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium">Profile picture</p>
              <p className="text-xs text-muted-foreground">Optional — skip for now if you like.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="rounded-2xl"
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="rounded-2xl"
              />
            </Field>
            <Field label="Nationality">
              <CountrySelect
                value={form.country || null}
                onChange={(v) => setForm({ ...form, country: v })}
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="rounded-2xl"
              />
            </Field>
            <Field label="Education level">
              <Select
                value={form.education_level}
                onValueChange={(v) => setForm({ ...form, education_level: v })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.v} value={l.v}>
                      {l.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Programme / field of study">
              <Input
                value={form.field_of_study}
                onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                placeholder="e.g. Computer Science"
                className="rounded-2xl"
              />
            </Field>
          </div>

          <Button onClick={finish} disabled={saving} className="w-full rounded-2xl">
            {saving ? "Saving…" : voice.onboarding.done}
          </Button>
        </section>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
