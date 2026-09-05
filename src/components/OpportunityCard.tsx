import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { categoryLabel, deadlineCopy, deriveStatus } from "@/lib/voice";
import type { Opportunity } from "@/lib/groundwork-types";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [open, setOpen] = useState(false);
  const status = deriveStatus(opp.opens_at, opp.deadline_at);
  const deadline = opp.deadline_at ? new Date(opp.deadline_at) : null;

  return (
    <article className="group min-w-0 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            <span className="shrink-0">{categoryLabel[opp.category] ?? opp.category}</span>
            {opp.organisations && (
              <>
                <span className="shrink-0">·</span>
                <span className="min-w-0 truncate">{opp.organisations.name}</span>
              </>
            )}
          </div>
          <h3 className="mt-2 break-words font-display text-base leading-snug text-foreground group-hover:text-primary sm:text-lg md:text-xl">
            <Link to="/opportunities/$id" params={{ id: opp.id }} className="break-words">
              {opp.title}
            </Link>
          </h3>
        </div>
        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>

      {opp.eligibility_summary && (
        <p
          className={cn(
            "mt-2 break-words text-sm text-muted-foreground",
            !open && "line-clamp-2"
          )}
        >
          {opp.eligibility_summary}
        </p>
      )}

      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted-foreground sm:text-xs">
        {opp.location && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{opp.location}</span>
          </span>
        )}
        {opp.work_mode ? (
          <span className="rounded bg-muted px-1.5 py-0.5 capitalize">
            {opp.work_mode === "onsite" ? "On-site" : opp.work_mode}
          </span>
        ) : opp.remote ? (
          <span className="rounded bg-muted px-1.5 py-0.5">Remote</span>
        ) : null}
        {(opp.salary_min || opp.salary_max) && (
          <span className="rounded bg-muted px-1.5 py-0.5">
            {opp.salary_currency ?? ""}
            {opp.salary_min?.toLocaleString() ?? ""}
            {opp.salary_min && opp.salary_max ? "–" : ""}
            {opp.salary_max?.toLocaleString() ?? ""}
            {opp.salary_period ? ` / ${opp.salary_period}` : ""}
          </span>
        )}
        <span className={status === "closing_soon" || status === "closed" ? "text-foreground" : ""}>
          {deadlineCopy(deadline, opp.id)}
        </span>
      </div>


      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {opp.description && (
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {opp.description}
            </p>
          )}
          {opp.fields?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opp.fields.map((f) => (
                <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                  {f}
                </span>
              ))}
            </div>
          )}
          <Link
            to="/opportunities/$id"
            params={{ id: opp.id }}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            View full details
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? "Less" : "More details"}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
    </article>
  );
}
