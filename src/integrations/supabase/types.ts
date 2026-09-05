export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_invites: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          rejected_at: string | null
          rejected_by: string | null
          revoked_at: string | null
          role: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          revoked_at?: string | null
          role: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          revoked_at?: string | null
          role?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          meta: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_email_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          kind: Database["public"]["Enums"]["community_kind"]
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["community_kind"]
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["community_kind"]
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          error_count: number
          finished_at: string | null
          id: string
          inserted_count: number
          notes: string | null
          source: string
          started_at: string
          updated_count: number
        }
        Insert: {
          error_count?: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          notes?: string | null
          source: string
          started_at?: string
          updated_count?: number
        }
        Update: {
          error_count?: number
          finished_at?: string | null
          id?: string
          inserted_count?: number
          notes?: string | null
          source?: string
          started_at?: string
          updated_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          apply_url: string
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at: string
          deadline_at: string | null
          description: string
          eligibility_summary: string | null
          featured: boolean
          fields: string[]
          funding_type: string | null
          hidden_at: string | null
          id: string
          ingested_at: string | null
          last_verified_at: string
          location: string | null
          opens_at: string | null
          org_id: string
          raw: Json | null
          remote: boolean
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          source_name: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          study_level: Database["public"]["Enums"]["study_level"] | null
          title: string
          updated_at: string
          work_mode: string | null
        }
        Insert: {
          apply_url: string
          category: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          deadline_at?: string | null
          description: string
          eligibility_summary?: string | null
          featured?: boolean
          fields?: string[]
          funding_type?: string | null
          hidden_at?: string | null
          id?: string
          ingested_at?: string | null
          last_verified_at?: string
          location?: string | null
          opens_at?: string | null
          org_id: string
          raw?: Json | null
          remote?: boolean
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          study_level?: Database["public"]["Enums"]["study_level"] | null
          title: string
          updated_at?: string
          work_mode?: string | null
        }
        Update: {
          apply_url?: string
          category?: Database["public"]["Enums"]["opportunity_category"]
          created_at?: string
          deadline_at?: string | null
          description?: string
          eligibility_summary?: string | null
          featured?: boolean
          fields?: string[]
          funding_type?: string | null
          hidden_at?: string | null
          id?: string
          ingested_at?: string | null
          last_verified_at?: string
          location?: string | null
          opens_at?: string | null
          org_id?: string
          raw?: Json | null
          remote?: boolean
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          study_level?: Database["public"]["Enums"]["study_level"] | null
          title?: string
          updated_at?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_applications: {
        Row: {
          created_at: string
          document_path: string | null
          id: string
          official_email: string
          org_id: string | null
          org_name: string
          org_type: Database["public"]["Enums"]["org_type"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          id?: string
          official_email: string
          org_id?: string | null
          org_name: string
          org_type: Database["public"]["Enums"]["org_type"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          document_path?: string | null
          id?: string
          official_email?: string
          org_id?: string | null
          org_name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_views: {
        Row: {
          created_at: string
          id: string
          org_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
          vote: number
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          community_id: string
          created_at: string
          hidden_at: string | null
          id: string
          kind: Database["public"]["Enums"]["post_kind"]
          link_url: string | null
          parent_post_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          community_id: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          link_url?: string | null
          parent_post_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          community_id?: string
          created_at?: string
          hidden_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["post_kind"]
          link_url?: string | null
          parent_post_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_language: string
          avatar_path: string | null
          banned_at: string | null
          banner_path: string | null
          bio: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          display_name: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          field_of_study: string | null
          fields_of_interest: string[]
          first_name: string | null
          gender: string | null
          id: string
          institution: string | null
          last_active_at: string | null
          last_login_at: string | null
          last_name: string | null
          must_change_password: boolean
          onboarded: boolean
          privacy_consent_at: string | null
          privacy_consent_version: string | null
          recovery_hint: string | null
          recovery_hint_set_at: string | null
          skills: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          app_language?: string
          avatar_path?: string | null
          banned_at?: string | null
          banner_path?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          field_of_study?: string | null
          fields_of_interest?: string[]
          first_name?: string | null
          gender?: string | null
          id: string
          institution?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          must_change_password?: boolean
          onboarded?: boolean
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          recovery_hint?: string | null
          recovery_hint_set_at?: string | null
          skills?: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          app_language?: string
          avatar_path?: string | null
          banned_at?: string | null
          banner_path?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          field_of_study?: string | null
          fields_of_interest?: string[]
          first_name?: string | null
          gender?: string | null
          id?: string
          institution?: string | null
          last_active_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          must_change_password?: boolean
          onboarded?: boolean
          privacy_consent_at?: string | null
          privacy_consent_version?: string | null
          recovery_hint?: string | null
          recovery_hint_set_at?: string | null
          skills?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_organisations: {
        Row: {
          created_at: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_organisations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      organisation_view_counts: {
        Row: {
          org_id: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_admin_signups_by_day: {
        Args: { _days?: number }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_org_view_counts: {
        Args: never
        Returns: {
          org_id: string
          view_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin" | "org" | "super_admin"
      community_kind: "topic" | "region" | "org" | "general"
      education_level:
        | "secondary"
        | "undergraduate"
        | "graduate"
        | "postgraduate"
        | "professional"
      notification_kind: "activity" | "opportunity" | "system"
      opportunity_category:
        | "scholarship"
        | "postgraduate"
        | "fellowship"
        | "internship"
        | "job"
        | "freelance"
        | "programme"
      org_type: "company" | "ngo" | "government" | "academic" | "foundation"
      post_kind: "post" | "repost" | "quote"
      source_type: "direct" | "aggregator" | "official_page"
      study_level:
        | "undergraduate"
        | "masters"
        | "phd"
        | "fellowship"
        | "job"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "org", "super_admin"],
      community_kind: ["topic", "region", "org", "general"],
      education_level: [
        "secondary",
        "undergraduate",
        "graduate",
        "postgraduate",
        "professional",
      ],
      notification_kind: ["activity", "opportunity", "system"],
      opportunity_category: [
        "scholarship",
        "postgraduate",
        "fellowship",
        "internship",
        "job",
        "freelance",
        "programme",
      ],
      org_type: ["company", "ngo", "government", "academic", "foundation"],
      post_kind: ["post", "repost", "quote"],
      source_type: ["direct", "aggregator", "official_page"],
      study_level: [
        "undergraduate",
        "masters",
        "phd",
        "fellowship",
        "job",
        "other",
      ],
    },
  },
} as const
