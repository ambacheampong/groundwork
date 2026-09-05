// Server-only ingestion module. Never imported from client code.
import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type StudyLevel = "undergraduate" | "masters" | "phd" | "fellowship" | "job" | "other";
type Category = "scholarship" | "postgraduate" | "fellowship" | "internship" | "job" | "freelance" | "programme";

interface ExtractedOpp {
  title: string;
  organisation: string;
  description: string;
  eligibility_summary?: string | null;
  location?: string | null;
  deadline_iso?: string | null;
  apply_url: string;
  category: Category;
  study_level: StudyLevel;
  funding_type?: string | null;
}

const SEARCH_BUCKETS: Array<{ query: string; hint: StudyLevel; category: Category; limit: number }> = [
  { query: "fully funded undergraduate scholarship 2026 application open", hint: "undergraduate", category: "scholarship", limit: 10 },
  { query: "international bachelors scholarship 2026 apply deadline", hint: "undergraduate", category: "scholarship", limit: 10 },
  { query: "undergraduate tuition fee waiver scholarship 2026", hint: "undergraduate", category: "scholarship", limit: 8 },
  { query: "fully funded masters scholarship 2026 deadline apply", hint: "masters", category: "scholarship", limit: 10 },
  { query: "MSc scholarship 2026 international students", hint: "masters", category: "scholarship", limit: 8 },
  { query: "PhD scholarship 2026 fully funded apply", hint: "phd", category: "scholarship", limit: 10 },
  { query: "PhD funding call 2026 doctoral fellowship", hint: "phd", category: "scholarship", limit: 8 },
  { query: "postdoctoral fellowship 2026 apply", hint: "fellowship", category: "fellowship", limit: 8 },
  { query: "early career fellowship 2026 apply", hint: "fellowship", category: "fellowship", limit: 8 },
  { query: "graduate trainee programme 2026 apply", hint: "job", category: "programme", limit: 8 },
  { query: "internship summer 2026 paid apply", hint: "job", category: "internship", limit: 8 },
  { query: "remote software engineer job 2026 apply", hint: "job", category: "job", limit: 6 },
];

function getFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  return new Firecrawl({ apiKey });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function findOrCreateOrg(name: string, sourceUrl: string): Promise<string> {
  const slug = slugify(name) || slugify(new URL(sourceUrl).hostname);
  const { data: existing } = await supabaseAdmin
    .from("organisations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;
  let website: string | null = null;
  try {
    website = new URL(sourceUrl).origin;
  } catch {
    /* ignore */
  }
  const { data: created, error } = await supabaseAdmin
    .from("organisations")
    .insert({
      slug,
      name,
      type: "foundation",
      description: null,
      logo_url: null,
      website,
      verified: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(`org insert failed: ${error.message}`);
  return (created as { id: string }).id;
}

async function extractFromMarkdown(
  markdown: string,
  url: string,
  hint: { study_level: StudyLevel; category: Category },
): Promise<ExtractedOpp | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  const trimmed = markdown.slice(0, 8000);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract structured opportunity metadata from web pages. Respond with strict JSON matching the provided schema. If the page is not an opportunity (scholarship/fellowship/job/internship/programme) listing or detail page, respond with {\"not_opportunity\": true}.",
        },
        {
          role: "user",
          content: `URL: ${url}\nHint: likely ${hint.study_level} / ${hint.category}\n\nMarkdown:\n${trimmed}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit",
            description: "Submit structured opportunity",
            parameters: {
              type: "object",
              properties: {
                not_opportunity: { type: "boolean" },
                title: { type: "string" },
                organisation: { type: "string" },
                description: { type: "string" },
                eligibility_summary: { type: "string" },
                location: { type: "string" },
                deadline_iso: { type: "string", description: "ISO 8601 date if found, else empty" },
                apply_url: { type: "string" },
                category: { type: "string", enum: ["scholarship", "postgraduate", "fellowship", "internship", "job", "freelance", "programme"] },
                study_level: { type: "string", enum: ["undergraduate", "masters", "phd", "fellowship", "job", "other"] },
                funding_type: { type: "string" },
              },
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit" } },
    }),
  });
  if (!res.ok) {
    console.error("AI extract failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(args);
  } catch {
    return null;
  }
  if (parsed.not_opportunity || !parsed.title || !parsed.organisation) return null;
  return {
    title: String(parsed.title).slice(0, 200),
    organisation: String(parsed.organisation).slice(0, 120),
    description: String(parsed.description ?? "").slice(0, 4000),
    eligibility_summary: (parsed.eligibility_summary as string) || null,
    location: (parsed.location as string) || null,
    deadline_iso: (parsed.deadline_iso as string) || null,
    apply_url: (parsed.apply_url as string) || url,
    category: (parsed.category as Category) || hint.category,
    study_level: (parsed.study_level as StudyLevel) || hint.study_level,
    funding_type: (parsed.funding_type as string) || null,
  };
}

function safeUrl(u: string): string | null {
  try {
    const url = new URL(u);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function upsertOpportunity(extracted: ExtractedOpp, sourceUrl: string, sourceName: string) {
  const orgId = await findOrCreateOrg(extracted.organisation, sourceUrl);
  const apply = safeUrl(extracted.apply_url) ?? safeUrl(sourceUrl);
  if (!apply) return { skipped: true } as const;
  const deadline = extracted.deadline_iso ? new Date(extracted.deadline_iso) : null;
  const payload = {
    org_id: orgId,
    title: extracted.title,
    category: extracted.category,
    location: extracted.location,
    remote: false,
    fields: [] as string[],
    eligibility_summary: extracted.eligibility_summary,
    description: extracted.description || extracted.title,
    apply_url: apply,
    source_url: sourceUrl,
    source_name: sourceName,
    source_type: "aggregator" as const,
    last_verified_at: new Date().toISOString(),
    deadline_at: deadline && !isNaN(deadline.getTime()) ? deadline.toISOString() : null,
    study_level: extracted.study_level,
    funding_type: extracted.funding_type,
    ingested_at: new Date().toISOString(),
  };
  const { data: existing } = await supabaseAdmin
    .from("opportunities")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();
  if (existing) {
    const { error } = await supabaseAdmin
      .from("opportunities")
      .update(payload)
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(error.message);
    return { updated: true } as const;
  }
  const { error } = await supabaseAdmin.from("opportunities").insert(payload);
  if (error) throw new Error(error.message);
  return { inserted: true } as const;
}

export async function runIngestion(): Promise<{ inserted: number; updated: number; errors: number; details: string[] }> {
  const firecrawl = getFirecrawl();
  const runStart = new Date().toISOString();
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const details: string[] = [];

  const BUCKET_PACING_MS = 7000; // stay under Firecrawl per-minute rate limit
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const [i, bucket] of SEARCH_BUCKETS.entries()) {
    if (i > 0) await sleep(BUCKET_PACING_MS);
    try {
      const searchRes = await firecrawl.search(bucket.query, {
        limit: bucket.limit,
        tbs: "qdr:m",
        scrapeOptions: { formats: ["markdown"] },
      });
      const results = ((searchRes as { web?: Array<unknown> }).web ??
        (searchRes as { data?: Array<unknown> }).data ??
        []) as Array<{ url?: string; title?: string; markdown?: string; description?: string }>;

      for (const r of results) {
        if (!r.url) continue;
        const md = r.markdown || r.description || r.title || "";
        if (md.length < 100) continue;
        try {
          const extracted = await extractFromMarkdown(md, r.url, {
            study_level: bucket.hint,
            category: bucket.category,
          });
          if (!extracted) continue;
          const sourceName = (() => {
            try {
              return new URL(r.url!).hostname.replace(/^www\./, "");
            } catch {
              return "web";
            }
          })();
          const result = await upsertOpportunity(extracted, r.url, sourceName);
          if ("inserted" in result && result.inserted) inserted++;
          if ("updated" in result && result.updated) updated++;
        } catch (e) {
          errors++;
          details.push(`${r.url}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      errors++;
      details.push(`bucket "${bucket.query}": ${(e as Error).message}`);
    }
  }

  await supabaseAdmin.from("ingestion_runs").insert({
    source: "firecrawl-search",
    started_at: runStart,
    finished_at: new Date().toISOString(),
    inserted_count: inserted,
    updated_count: updated,
    error_count: errors,
    notes: details.slice(0, 20).join("\n") || null,
  });

  return { inserted, updated, errors, details };
}
