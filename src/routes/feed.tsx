import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, queryOptions, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOpportunities } from "@/lib/opportunities.functions";
import { triggerIngestion } from "@/lib/ingest.functions";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { AppShell } from "@/components/AppShell";
import { OpportunityCard } from "@/components/OpportunityCard";
import { voice, categoryLabel } from "@/lib/voice";
import { toast } from "sonner";
import type { Opportunity } from "@/lib/groundwork-types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

const CATS = ["all", "scholarship", "postgraduate", "fellowship", "internship", "job", "freelance", "programme"] as const;
const LEVELS = [
  { id: "all", label: "All levels" },
  { id: "undergraduate", label: "Undergrad" },
  { id: "masters", label: "Masters" },
  { id: "phd", label: "PhD" },
  { id: "fellowship", label: "Fellowship" },
  { id: "job", label: "Job" },
] as const;

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "deadline", label: "Deadline soonest" },
  { id: "salary", label: "Salary high to low" },
] as const;

const STATUSES = [
  { id: "all", label: "All listings" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
] as const;

type Filters = {
  category: string;
  level: string;
  q: string;
  location: string;
  work_mode: string;
  salary_min: string;
  salary_max: string;
  status: string;
};

const DEFAULTS: Filters = {
  category: "all",
  level: "all",
  q: "",
  location: "",
  work_mode: "all",
  salary_min: "",
  salary_max: "",
  status: "all",
};

const feedOpts = (f: Filters, sort: string) =>
  queryOptions({
    queryKey: ["opportunities", f, sort],
    queryFn: () =>
      listOpportunities({
        data: {
          category: f.category,
          level: f.level,
          q: f.q || undefined,
          location: f.location || undefined,
          work_mode: f.work_mode,
          salary_min: f.salary_min ? Number(f.salary_min) : null,
          salary_max: f.salary_max ? Number(f.salary_max) : null,
          status: f.status as "all" | "open" | "closed",
          sort: sort as "newest" | "deadline" | "salary",
        },
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed — Groundwork" },
      {
        name: "description",
        content:
          "Scholarships, fellowships, internships and jobs that are still open. Filter by location, work mode, salary and level.",
      },
      { property: "og:title", content: "Feed — Groundwork" },
      {
        property: "og:description",
        content: "Everything new and still open, filtered the way you want it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedOpts(DEFAULTS, "deadline")),
  component: Feed,
});


function Feed() {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [qInput, setQInput] = useState("");
  const [sort, setSort] = useState<string>("deadline");
  const [refreshing, setRefreshing] = useState(false);

  // Debounce typing so the feed doesn't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput })), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data, isFetching } = useQuery(feedOpts(filters, sort));
  const opps = (data ?? []) as unknown as Opportunity[];
  const qc = useQueryClient();
  const runIngest = useServerFn(triggerIngestion);
  const adminQ = useIsAdmin();


  const activeCount = useMemo(
    () =>
      (Object.keys(DEFAULTS) as (keyof Filters)[]).filter(
        (k) => filters[k] !== DEFAULTS[k],
      ).length,
    [filters],
  );

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await runIngest();
      toast.success(`Pulled ${res.inserted} new, updated ${res.updated}`);
      await qc.invalidateQueries({ queryKey: ["opportunities"] });
    } catch (e) {
      toast.error((e as Error).message || "Refresh failed (admins only)");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Today's opportunities</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything new and still open. Filter, ignore what isn't for you.
          </p>
        </div>
        {adminQ.data?.admin ? (
          <button
            onClick={refresh}
            disabled={refreshing}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50"
            title="Admins only"
          >
            {refreshing ? "Pulling…" : "Refresh from web"}
          </button>
        ) : null}
      </div>

      {/* Search + filters */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search"
            className="h-10 rounded-2xl pl-9 text-[13px] font-normal placeholder:font-normal"
          />
          {isFetching ? (
            <span className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
          ) : null}
        </div>


        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0 rounded-2xl"
              aria-label={`Filters${activeCount ? ` (${activeCount} active)` : ""}`}
            >
              <SlidersHorizontal className="size-4" />
              {activeCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] space-y-4 rounded-3xl">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Location / county
              </Label>
              <Input
                value={filters.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="e.g. Accra, Nairobi"
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Work mode
              </Label>
              <Select value={filters.work_mode} onValueChange={(v) => set({ work_mode: v })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Salary range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  inputMode="numeric"
                  value={filters.salary_min}
                  onChange={(e) => set({ salary_min: e.target.value.replace(/\D/g, "") })}
                  placeholder="Min"
                  className="rounded-2xl"
                />
                <Input
                  inputMode="numeric"
                  value={filters.salary_max}
                  onChange={(e) => set({ salary_max: e.target.value.replace(/\D/g, "") })}
                  placeholder="Max"
                  className="rounded-2xl"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only applies to listings that publish salary data.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Level</Label>
              <Select value={filters.level} onValueChange={(v) => set({ level: v })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
              <Select value={filters.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "all" ? "All types" : (categoryLabel[c] ?? c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </Label>
              <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Sort by
              </Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setFilters(DEFAULTS);
                setQInput("");
              }}
              className="w-full rounded-2xl"
            >
              Reset filters
            </Button>
          </PopoverContent>
        </Popover>
      </div>


      <div className="scroll-strip mb-3 flex gap-2 sm:flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => set({ level: l.id })}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
              filters.level === l.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="scroll-strip mb-6 flex gap-2 sm:flex-wrap">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => set({ category: c })}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
              filters.category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {c === "all" ? "All" : (categoryLabel[c] ?? c)}
          </button>
        ))}
      </div>

      {!data && isFetching ? (
        <div className="grid grid-cols-1 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : opps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {voice.empty.feed}
        </p>
      ) : (
        <div className={`grid grid-cols-1 gap-3 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {opps.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}

    </AppShell>
  );
}
