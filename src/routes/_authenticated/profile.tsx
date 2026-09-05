import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, softDeleteMyAccount, updateMyProfile } from "@/lib/user.functions";
import { AppShell } from "@/components/AppShell";
import { CountrySelect } from "@/components/CountrySelect";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";

import { useSignedUrl } from "@/lib/use-signed-url";
import { supabase } from "@/integrations/supabase/client";
import { isCapacitor, pickNativePhoto } from "@/lib/native";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Groundwork" }] }),
  component: ProfilePage,
});

const LEVELS = [
  { v: "secondary", l: "Secondary" },
  { v: "undergraduate", l: "Undergraduate" },
  { v: "graduate", l: "Graduate" },
  { v: "postgraduate", l: "Postgraduate" },
  { v: "professional", l: "Working professional" },
];

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];
const TITLES = ["Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Prof", "Rev", "Sir", "Dame"];

function ProfilePage() {
  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const update = useServerFn(updateMyProfile);
  const softDelete = useServerFn(softDeleteMyAccount);

  const updateMut = useMutation({
    mutationFn: (data: any) => update({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Saved.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed."),
  });

  const deleteMut = useMutation({
    mutationFn: () => softDelete(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      qc.clear();
      navigate({ to: "/auth", replace: true });
    },
  });

  const [form, setForm] = useState({
    title: "",
    first_name: "",
    last_name: "",
    display_name: "",
    bio: "",
    date_of_birth: "",
    gender: "",
    country: "",
    education_level: "",
    institution: "",
    field_of_study: "",
    avatar_path: "" as string | null,
    banner_path: "" as string | null,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [uploading, setUploading] = useState<null | "avatar" | "banner">(null);

  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data as any;
    setForm({
      title: p.title ?? "",
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      display_name: p.display_name ?? "",
      bio: p.bio ?? "",
      date_of_birth: p.date_of_birth ?? "",
      gender: p.gender ?? "",
      country: p.country ?? "",
      education_level: p.education_level ?? "",
      institution: p.institution ?? "",
      field_of_study: p.field_of_study ?? "",
      avatar_path: p.avatar_path ?? null,
      banner_path: p.banner_path ?? null,
    });
    setSkills(p.skills ?? []);
    setInterests(p.fields_of_interest ?? []);
  }, [profileQ.data]);

  const avatarUrl = useSignedUrl("avatars", form.avatar_path);
  const bannerUrl = useSignedUrl("banners", form.banner_path);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const handlePhotoClick = async (kind: "avatar" | "banner") => {
    if (await isCapacitor()) {
      const file = await pickNativePhoto();
      if (file) {
        upload(kind, file);
        return;
      }
    }
    if (kind === "avatar") avatarInput.current?.click();
    else bannerInput.current?.click();
  };

  const upload = async (kind: "avatar" | "banner", file: File) => {
    setUploading(kind);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const bucket = kind === "avatar" ? "avatars" : "banners";
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const next = kind === "avatar" ? { avatar_path: path } : { banner_path: path };
      setForm((f) => ({ ...f, ...next }));
      await update({ data: next });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success(`${kind === "avatar" ? "Photo" : "Banner"} updated.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const addChip = (kind: "skill" | "interest") => {
    const v = (kind === "skill" ? skillInput : interestInput).trim();
    if (!v) return;
    if (kind === "skill") {
      if (!skills.includes(v)) setSkills([...skills, v]);
      setSkillInput("");
    } else {
      if (!interests.includes(v)) setInterests([...interests, v]);
      setInterestInput("");
    }
  };

  const onSave = () => {
    updateMut.mutate({
      ...form,
      title: form.title || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      country: form.country || null,
      education_level: (form.education_level || null) as any,
      skills,
      fields_of_interest: interests,
      onboarded: true,
    });
  };

  const initials =
    (form.first_name?.[0] ?? form.display_name?.[0] ?? "?").toUpperCase() +
    (form.last_name?.[0] ?? "").toUpperCase();

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Banner + avatar header */}
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="relative h-44 sm:h-56">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/10" />
            )}
            <button
              onClick={() => handlePhotoClick("banner")}
              className="glass absolute right-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-background/80"
              disabled={uploading === "banner"}
            >
              {uploading === "banner" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ImagePlus className="size-3" />
              )}
              Change banner
            </button>
            <input
              ref={bannerInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload("banner", e.target.files[0])}
            />
          </div>
          <div className="relative px-5 pb-5 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-secondary text-2xl font-semibold text-secondary-foreground">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handlePhotoClick("avatar")}
                    className="glass absolute bottom-1 right-1 grid size-8 place-items-center rounded-full hover:bg-background/80"
                    aria-label="Change photo"
                    disabled={uploading === "avatar"}
                  >
                    {uploading === "avatar" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Camera className="size-3.5" />
                    )}
                  </button>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && upload("avatar", e.target.files[0])}
                  />
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-2xl sm:text-3xl">
                    {form.first_name || form.last_name
                      ? `${form.first_name} ${form.last_name}`.trim()
                      : form.display_name || "Your profile"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {[form.country, form.field_of_study].filter(Boolean).join(" · ") ||
                      "Add a few details so the feed stops guessing."}
                  </p>
                </div>
              </div>
              <Button onClick={onSave} disabled={updateMut.isPending} className="rounded-2xl">
                {updateMut.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>

        <ProfileCompleteness profile={profileQ.data as Record<string, unknown> | null} />

        {/* About */}

        <Section title="About you">
          <Grid>
            <FieldGroup label="Title">
              <Select
                value={form.title}
                onValueChange={(v) => setForm({ ...form, title: v })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {TITLES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="First name">
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="rounded-2xl"
              />
            </FieldGroup>
            <FieldGroup label="Last name">
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="rounded-2xl"
              />
            </FieldGroup>
            <FieldGroup label="Display name">
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="What people see"
                className="rounded-2xl"
              />
            </FieldGroup>
            <FieldGroup label="Date of birth">
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="rounded-2xl"
              />
            </FieldGroup>
            <FieldGroup label="Gender">
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v })}
              >
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
            </FieldGroup>
            <FieldGroup label="Country">
              <CountrySelect
                value={form.country || null}
                onChange={(v) => setForm({ ...form, country: v })}
              />
            </FieldGroup>
          </Grid>
          <FieldGroup label="Bio">
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="A short line about you. Keep it tight."
              maxLength={500}
              rows={3}
              className="rounded-2xl"
            />
          </FieldGroup>
        </Section>

        {/* Education */}
        <Section title="Education">
          <Grid>
            <FieldGroup label="Education level">
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
            </FieldGroup>
            <FieldGroup label="Institution">
              <Input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="University / school"
                className="rounded-2xl"
              />
            </FieldGroup>
            <FieldGroup label="Field of study">
              <Input
                value={form.field_of_study}
                onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                placeholder="e.g. Computer Science"
                className="rounded-2xl"
              />
            </FieldGroup>
          </Grid>
        </Section>

        {/* Skills & interests */}
        <Section title="Skills">
          <ChipEditor
            items={skills}
            onRemove={(v) => setSkills(skills.filter((x) => x !== v))}
            input={skillInput}
            setInput={setSkillInput}
            onAdd={() => addChip("skill")}
            placeholder="Add a skill and press enter"
          />
        </Section>

        <Section title="Interests">
          <ChipEditor
            items={interests}
            onRemove={(v) => setInterests(interests.filter((x) => x !== v))}
            input={interestInput}
            setInput={setInterestInput}
            onAdd={() => addChip("interest")}
            placeholder="e.g. Climate, Robotics, Policy"
          />
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone" tone="danger">
          <p className="text-sm text-muted-foreground">
            Soft-deletes your profile and signs you out. You can come back; we'll keep the lights
            on for 30 days.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-4 rounded-2xl">
                <Trash2 className="mr-2 size-4" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile will be marked deleted and you'll be signed out. Saves and tracks
                  stay on the row until you confirm a permanent delete from support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMut.mutate()}
                  className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMut.isPending ? "Deleting…" : "Yes, delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <section
      className={`glass-strong animate-float-in space-y-4 rounded-3xl p-6 sm:p-8 ${
        tone === "danger" ? "border-destructive/40" : ""
      }`}
    >
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ChipEditor({
  items,
  onRemove,
  input,
  setInput,
  onAdd,
  placeholder,
}: {
  items: string[];
  onRemove: (v: string) => void;
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-transform hover:scale-105"
          >
            {v}
            <button
              type="button"
              onClick={() => onRemove(v)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground">Nothing yet.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="rounded-2xl"
        />
        <Button type="button" onClick={onAdd} variant="secondary" className="rounded-2xl">
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
