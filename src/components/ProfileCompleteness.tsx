import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

type P = Record<string, unknown> | null | undefined;

const FIELDS: { key: string; label: string; nudge: string }[] = [
  { key: "first_name", label: "First name", nudge: "Add your first name" },
  { key: "last_name", label: "Last name", nudge: "Add your last name" },
  { key: "country", label: "Country", nudge: "Set your country" },
  { key: "date_of_birth", label: "Date of birth", nudge: "Add your date of birth" },
  { key: "gender", label: "Gender", nudge: "Add your gender" },
  { key: "avatar_path", label: "Profile photo", nudge: "Add a profile photo" },
  { key: "banner_path", label: "Banner", nudge: "Add a banner image" },
  { key: "bio", label: "Bio", nudge: "Write a one-line bio" },
  { key: "education_level", label: "Education level", nudge: "Set your education level" },
  { key: "institution", label: "Institution", nudge: "Add your institution" },
  { key: "field_of_study", label: "Field of study", nudge: "Add your field of study" },
  { key: "skills", label: "Skills", nudge: "Add a few skills" },
  { key: "fields_of_interest", label: "Interests", nudge: "Pick some interests" },
];

function filled(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export function ProfileCompleteness({ profile }: { profile: P }) {
  const done = FIELDS.filter((f) => filled(profile?.[f.key]));
  const pct = Math.round((done.length / FIELDS.length) * 100);
  const next = FIELDS.find((f) => !filled(profile?.[f.key]));

  return (
    <section className="glass-strong animate-float-in space-y-3 rounded-3xl p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate font-display text-lg">
          Your profile is {pct}% complete
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">
          {done.length}/{FIELDS.length}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      {next ? (
        <div className="flex min-w-0 items-start gap-2 rounded-2xl bg-muted/60 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="min-w-0 text-muted-foreground">
            <span className="text-foreground">{next.nudge}</span> — optional, but it sharpens what
            the feed shows you. No rush.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Fully filled in. Nothing left to nag you about.
        </p>
      )}
    </section>
  );
}
