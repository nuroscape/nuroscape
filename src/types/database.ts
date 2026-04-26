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
          session_id: string;
          user_id: string | null;
          responses: Json;
          scores: Json;
          report: Json | null;
          paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          responses?: Json;
          scores?: Json;
          report?: Json | null;
          paid?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          responses?: Json;
          scores?: Json;
          report?: Json | null;
          paid?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
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
          stripe_customer_id: string | null;
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
      stripe_webhook_events: {
        Row: {
          id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          created_at?: string;
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
