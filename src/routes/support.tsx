import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitSupportRequest } from "@/lib/support.functions";
import { LifeBuoy, Mail, MessageSquare, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Groundwork" },
      {
        name: "description",
        content:
          "Contact the Groundwork team about your account, a listing, organisation verification or a bug.",
      },
      { property: "og:title", content: "Support — Groundwork" },
      {
        property: "og:description",
        content: "Contact the Groundwork team about your account, a listing or a bug.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const TOPICS = [
  { v: "account", l: "Account and sign in" },
  { v: "listing", l: "A listing is wrong or closed" },
  { v: "organisation", l: "Organisation verification" },
  { v: "bug", l: "Something is broken" },
  { v: "privacy", l: "Privacy or data request" },
  { v: "other", l: "Something else" },
] as const;

const field =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function SupportPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["v"]>("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submitSupportRequest({
        data: { email, name: name || null, topic, subject, message },
      });
      setReference(res.reference);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That did not send. Try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Support</h1>
          <p className="text-sm text-muted-foreground">
            Tell us what happened. Real answers, usually within two working days.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <Mail className="size-5 text-primary" />
            <p className="mt-2 text-sm font-medium">Email</p>
            <p className="text-xs text-muted-foreground">support@groundworkapply.com</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <LifeBuoy className="size-5 text-primary" />
            <p className="mt-2 text-sm font-medium">Answers first</p>
            <p className="text-xs text-muted-foreground">
              <Link to="/faq" className="text-primary underline">
                Check the FAQ
              </Link>{" "}
              before you write.
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <MessageSquare className="size-5 text-primary" />
            <p className="mt-2 text-sm font-medium">Response time</p>
            <p className="text-xs text-muted-foreground">Two working days, Monday to Friday.</p>
          </div>
        </div>

        {reference ? (
          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <CheckCircle2 className="size-8 text-primary" />
            <h2 className="mt-3 font-display text-xl">Request received</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your reference is <span className="font-mono text-foreground">{reference}</span>. Keep it for
              follow up. We will reply to {email}.
            </p>
            <Button
              className="mt-5 rounded-2xl"
              variant="outline"
              onClick={() => {
                setReference(null);
                setSubject("");
                setMessage("");
              }}
            >
              Send another request
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-strong space-y-4 rounded-3xl p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Your email</Label>
                <input
                  type="email"
                  required
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Your name</Label>
                <input
                  className={field}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Topic</Label>
              <select
                className={field}
                value={topic}
                onChange={(e) => setTopic(e.target.value as typeof topic)}
              >
                {TOPICS.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <input
                required
                minLength={4}
                className={field}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                required
                minLength={10}
                rows={6}
                className={field}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened, and what you expected instead."
              />
            </div>

            <Button type="submit" disabled={busy} className="w-full rounded-2xl sm:w-auto">
              {busy ? "Sending" : "Send request"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
