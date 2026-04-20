export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          user_id: string;
          status: "in_progress" | "completed";
          responses: Json;
          score_inattention: number | null;
          score_hyperactivity: number | null;
          score_total: number | null;
          report_html: string | null;
          report_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "in_progress" | "completed";
          responses?: Json;
          score_inattention?: number | null;
          score_hyperactivity?: number | null;
          score_total?: number | null;
          report_html?: string | null;
          report_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "in_progress" | "completed";
          responses?: Json;
          score_inattention?: number | null;
          score_hyperactivity?: number | null;
          score_total?: number | null;
          report_html?: string | null;
          report_generated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          stripe_payment_intent_id: string | null;
          status: "trialing" | "active" | "canceled" | "past_due" | "incomplete";
          plan: "trial" | "monthly";
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: "trialing" | "active" | "canceled" | "past_due" | "incomplete";
          plan?: "trial" | "monthly";
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: "trialing" | "active" | "canceled" | "past_due" | "incomplete";
          plan?: "trial" | "monthly";
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
