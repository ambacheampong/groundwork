import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Groundwork — Every opportunity in one place" },
      {
        name: "description",
        content:
          "Scholarships, fellowships, internships, jobs and freelance work for students and young professionals. One continuously updated feed.",
      },
      { property: "og:title", content: "Groundwork — Every opportunity in one place" },
      {
        property: "og:description",
        content: "Stop checking ten newsletters. Start here.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5">
        <span className="flex min-w-0 items-center gap-2">
          <Logo className="size-8 shrink-0" />
          <span className="truncate font-display text-lg font-semibold sm:text-2xl">Groundwork</span>
        </span>
        <Link
          to="/auth"
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted sm:px-4 sm:py-2 sm:text-sm"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-20 md:py-32">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary sm:text-sm">
          Opportunities, consolidated
        </p>
        <h1 className="mt-4 text-balance font-display text-[1.75rem] leading-[1.15] sm:mt-6 sm:text-5xl sm:leading-tight md:text-7xl">
          Stop checking ten newsletters.
          <br />
          <span className="text-primary">Start here.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:mt-6 sm:text-lg">
          Scholarships, fellowships, internships, jobs, freelance work and funded
          programmes — for students and young professionals. One feed. Sources cited.
          Filtered to people like you.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-6 sm:py-3"
          >
            Make an account
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted sm:px-6 sm:py-3"
          >
            I already have one
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:pb-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 md:grid-cols-4">

          {[
            { n: "01", k: "Discovery", v: "Every category in one feed. Personalised once you tell us who you are." },
            { n: "02", k: "Application", v: "CV, cover letter and personal-statement tools. Coming next." },
            { n: "03", k: "Community", v: "Topic-specific hubs to share progress and ask questions. Coming next." },
            { n: "04", k: "Guidance", v: "An AI assistant that knows eligibility cold. Coming next." },
          ].map((p) => (
            <div key={p.n} className="bg-card p-5 sm:p-6">
              <span className="font-display text-xs text-primary sm:text-sm">{p.n}</span>
              <h3 className="mt-2 font-display text-lg sm:text-xl">{p.k}</h3>
              <p className="mt-2 text-[13px] text-muted-foreground sm:text-sm">{p.v}</p>
            </div>
          ))}

        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
          Groundwork · Free for individuals.
        </div>
      </footer>
    </div>
  );
}

