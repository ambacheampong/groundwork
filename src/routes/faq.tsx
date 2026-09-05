import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Groundwork" },
      {
        name: "description",
        content:
          "Answers to common questions about Groundwork accounts, opportunity listings, verification and notifications.",
      },
      { property: "og:title", content: "FAQ — Groundwork" },
      {
        property: "og:description",
        content: "Answers to common questions about accounts, listings, verification and notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Groundwork?",
    a: "Groundwork gathers scholarships, fellowships, internships, jobs and programmes from verified organisations into one feed, so you stop checking ten newsletters to find one deadline.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No. Browsing the feed, organisations and community is open to everyone. You only need an account to save listings, track organisations, post, comment or receive alerts.",
  },
  {
    q: "How do I reset my password?",
    a: (
      <>
        Use{" "}
        <Link to="/forgot-password" className="text-primary underline">
          Forgot password
        </Link>
        . Individual accounts can reset themselves. Organisation and admin accounts are recovered by a
        super admin for security reasons.
      </>
    ),
  },
  {
    q: "How does organisation verification work?",
    a: "Sign up as an organisation, submit your name, category and a verification document. An admin reviews the document. Once approved, your profile is listed publicly and posting tools unlock in your dashboard.",
  },
  {
    q: "Where do the listings come from?",
    a: "Two sources: verified organisations posting directly, and an automated daily sweep of official pages and reputable aggregators. Every listing links to the original application page.",
  },
  {
    q: "A listing is closed or wrong. What now?",
    a: (
      <>
        Tell us through{" "}
        <Link to="/support" className="text-primary underline">
          Support
        </Link>{" "}
        and include the listing title. Closed listings are marked automatically once the deadline passes.
      </>
    ),
  },
  {
    q: "How do notifications work?",
    a: "Deadline alerts, a weekly digest and product updates can each be turned on or off in Settings. Alerts also appear in the Alerts tab, grouped into activity, opportunities and system.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Profile has a delete option. Deletion is a soft delete: your data is hidden immediately and permanently removed after 30 days, so a mistake is reversible.",
  },
  {
    q: "Is Groundwork free?",
    a: "Yes. Browsing, saving, tracking and applying through Groundwork are free for individuals.",
  },
];

function FaqPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Frequently asked questions</h1>
          <p className="text-sm text-muted-foreground">
            The short answers. If yours is not here, Support is one tab away.
          </p>
        </header>

        <div className="glass-strong rounded-3xl p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link to="/support" className="text-primary underline">
            Contact support
          </Link>
          .
        </p>
      </div>
    </AppShell>
  );
}
