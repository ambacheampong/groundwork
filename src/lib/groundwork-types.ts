export type OpportunityCategory =
  | "scholarship"
  | "postgraduate"
  | "fellowship"
  | "internship"
  | "job"
  | "freelance"
  | "programme";

export type OrgType = "company" | "ngo" | "government" | "academic" | "foundation";

export interface Organisation {
  id: string;
  slug: string;
  name: string;
  type: OrgType;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  verified: boolean;
}

export interface Opportunity {
  id: string;
  org_id: string;
  title: string;
  category: OpportunityCategory;
  location: string | null;
  remote: boolean;
  fields: string[];
  eligibility_summary: string | null;
  description: string;
  apply_url: string;
  source_url: string | null;
  source_type: "direct" | "aggregator" | "official_page";
  last_verified_at: string;
  opens_at: string | null;
  deadline_at: string | null;
  work_mode?: "remote" | "onsite" | "hybrid" | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  organisations?: Pick<Organisation, "id" | "slug" | "name" | "type" | "logo_url">;

}

export interface Profile {
  id: string;
  display_name: string | null;
  country: string | null;
  education_level: string | null;
  fields_of_interest: string[];
  onboarded: boolean;
}
