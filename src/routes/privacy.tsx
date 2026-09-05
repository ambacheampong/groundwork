import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy notice — Groundwork" },
      {
        name: "description",
        content:
          "How Groundwork collects, uses, stores and deletes your personal data, and the choices you have.",
      },
      { property: "og:title", content: "Privacy notice — Groundwork" },
      {
        property: "og:description",
        content: "How Groundwork collects, uses, stores and deletes your personal data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg sm:text-xl">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Privacy notice</h1>
          <p className="text-sm text-muted-foreground">
            Last updated 5 September 2026. Written to be read, not skimmed past.
          </p>
        </header>

        <div className="glass-strong space-y-6 rounded-3xl p-5 sm:p-8">
          <Section title="What we collect">
            <p>
              Account details you give us: name, email address, date of birth, gender, nationality and
              profile photo. Optional profile details: education, field of study, skills and interests.
            </p>
            <p>
              Activity created in the app: saved listings, tracked organisations, community posts and
              comments, and notification preferences.
            </p>
            <p>
              Technical data needed to run the service: sign-in timestamps, device push tokens if you
              enable notifications, and basic error reports.
            </p>
          </Section>

          <Section title="Why we collect it">
            <p>
              To create and secure your account, to match you with relevant opportunities, to send the
              alerts you asked for, to verify organisations before they can publish, and to keep the
              service working and free of abuse.
            </p>
          </Section>

          <Section title="What we never do">
            <p>
              We do not sell your personal data. We do not share your profile with advertisers. We do not
              publish your saved listings or your email address.
            </p>
          </Section>

          <Section title="Organisation verification documents">
            <p>
              Documents uploaded during organisation verification are stored privately and are visible only
              to reviewing administrators. They are not published in the directory.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can edit or clear any profile field at any time, turn every category of notification off,
              export a copy of your data from Settings, and delete your account from your Profile page.
            </p>
            <p>
              Deletion is immediate from your side and permanent after 30 days, which gives you a window to
              change your mind.
            </p>
          </Section>

          <Section title="How long we keep data">
            <p>
              Account data is kept while your account is active. Deleted accounts are purged after 30 days.
              Aggregate, non identifying usage counts may be kept longer for reporting.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this notice, or a request to access or erase your data, can be sent through{" "}
              <Link to="/support" className="text-primary underline">
                Support
              </Link>{" "}
              or by email to privacy@groundworkapply.com. We respond within 30 days.
            </p>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
