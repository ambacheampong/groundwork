import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useTheme } from "@/lib/theme";
import { getMyProfile } from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Monitor, LogOut, UserCog, Bell, Mail, Languages, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Groundwork" }] }),
  component: SettingsPage,
});

type Prefs = {
  deadlineAlerts: boolean;
  weeklyDigest: boolean;
  productEmails: boolean;
  emailFrequency: "instant" | "daily" | "weekly" | "off";
  language: string;
  reducedMotion: boolean;
  compact: boolean;
  defaultLanding: "/feed" | "/saved" | "/organisations";
};

const DEFAULTS: Prefs = {
  deadlineAlerts: true,
  weeklyDigest: true,
  productEmails: false,
  emailFrequency: "weekly",
  language: "en",
  reducedMotion: false,
  compact: false,
  defaultLanding: "/feed",
};

const KEY = "gw-prefs";

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => setPrefs(loadPrefs()), []);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (k === "reducedMotion") {
      document.documentElement.classList.toggle("reduce-motion", Boolean(v));
    }
    if (k === "compact") {
      document.documentElement.classList.toggle("compact", Boolean(v));
    }
    toast.success("Preference saved.");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const email = (profileQ.data as any)?.email ?? "—";

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="font-display text-3xl sm:text-4xl">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Tune Groundwork to how you actually use it. Changes save instantly.
          </p>
        </header>

        <Section icon={<Sparkles className="size-4" />} title="Appearance">
          <Row label="Theme" hint="Light, dark, or whatever your system says.">
            <div className="flex gap-2">
              {([
                { v: "light", l: "Light", Icon: Sun },
                { v: "dark", l: "Dark", Icon: Moon },
              ] as const).map(({ v, l, Icon }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                    theme === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  {l}
                </button>
              ))}
              <button
                onClick={() => {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  setTheme(prefersDark ? "dark" : "light");
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <Monitor className="size-4" />
                System
              </button>
            </div>
          </Row>
          <Toggle
            label="Reduced motion"
            hint="Cuts the animations. Easier on the eyes, easier on the laptop fan."
            checked={prefs.reducedMotion}
            onChange={(v) => update("reducedMotion", v)}
          />
          <Toggle
            label="Compact density"
            hint="Tighter spacing for power users."
            checked={prefs.compact}
            onChange={(v) => update("compact", v)}
          />
        </Section>

        <Section icon={<Bell className="size-4" />} title="Notifications">
          <Toggle
            label="Deadline alerts"
            hint="Pings when an opportunity you saved is closing soon."
            checked={prefs.deadlineAlerts}
            onChange={(v) => update("deadlineAlerts", v)}
          />
          <Toggle
            label="Weekly digest"
            hint="One email on Sundays with what's new in your categories."
            checked={prefs.weeklyDigest}
            onChange={(v) => update("weeklyDigest", v)}
          />
          <Toggle
            label="Product updates"
            hint="Occasional notes when we ship something worth your attention."
            checked={prefs.productEmails}
            onChange={(v) => update("productEmails", v)}
          />
        </Section>

        <Section icon={<Mail className="size-4" />} title="Email & language">
          <Row label="Email frequency" hint="How often we're allowed in your inbox.">
            <Select
              value={prefs.emailFrequency}
              onValueChange={(v) => update("emailFrequency", v as Prefs["emailFrequency"])}
            >
              <SelectTrigger className="w-48 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Language" hint="Only English right now. More on the way.">
            <Select value={prefs.language} onValueChange={(v) => update("language", v)}>
              <SelectTrigger className="w-48 rounded-2xl">
                <Languages className="mr-2 size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr" disabled>
                  Français (soon)
                </SelectItem>
                <SelectItem value="sw" disabled>
                  Kiswahili (soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Default landing page" hint="Where Groundwork drops you on sign-in.">
            <Select
              value={prefs.defaultLanding}
              onValueChange={(v) => update("defaultLanding", v as Prefs["defaultLanding"])}
            >
              <SelectTrigger className="w-48 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/feed">Feed</SelectItem>
                <SelectItem value="/saved">Saved</SelectItem>
                <SelectItem value="/organisations">Organisations</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={<UserCog className="size-4" />} title="Account">
          <Row label="Signed in as" hint={email}>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </Row>
          <Row label="Session" hint="Sign out on this device.">
            <Button variant="outline" onClick={signOut} className="rounded-2xl">
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </Row>
          <Row label="Delete account" hint="Soft delete from the profile page. Reversible for 30 days.">
            <Button asChild variant="destructive" className="rounded-2xl">
              <Link to="/profile">Go to profile</Link>
            </Button>
          </Row>
        </Section>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy notice
          </Link>
        </p>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Groundwork · v0.1 · Built deliberately.
        </p>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong animate-float-in space-y-5 rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-4 first:border-0 first:pt-0 sm:flex-row sm:items-center">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Row>
  );
}
