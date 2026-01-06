export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "barber" | "staff" | "client";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentType = "one_time" | "subscription";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "expired";
export type PaymentProvider = "abacatepay";
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "past_due"
  | "expired";
export type LedgerKind = "credit" | "debit";
export type LedgerCategory =
  | "service_payment"
  | "subscription_payment"
  | "refund"
  | "commission"
  | "expense"
  | "adjustment"
  | "withdrawal";
export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled";
export type WebhookStatus =
  | "received"
  | "processing"
  | "processed"
  | "failed"
  | "ignored";

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string;
          barbershop_name: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          whatsapp: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          opening_time: string;
          closing_time: string;
          working_days: number[];
          slot_duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barbershop_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          whatsapp?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          opening_time?: string;
          closing_time?: string;
          working_days?: number[];
          slot_duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barbershop_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          whatsapp?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          opening_time?: string;
          closing_time?: string;
          working_days?: number[];
          slot_duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      barbers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          bio: string | null;
          commission_percentage: number;
          specialties: string[] | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          commission_percentage?: number;
          specialties?: string[] | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          commission_percentage?: number;
          specialties?: string[] | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          category: string | null;
          allow_subscription: boolean;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          duration_minutes?: number;
          category?: string | null;
          allow_subscription?: boolean;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          category?: string | null;
          allow_subscription?: boolean;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string;
          cpf: string | null;
          birth_date: string | null;
          notes: string | null;
          preferred_barber_id: string | null;
          total_visits: number;
          last_visit_at: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          phone: string;
          cpf?: string | null;
          birth_date?: string | null;
          notes?: string | null;
          preferred_barber_id?: string | null;
          total_visits?: number;
          last_visit_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string;
          cpf?: string | null;
          birth_date?: string | null;
          notes?: string | null;
          preferred_barber_id?: string | null;
          total_visits?: number;
          last_visit_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status: AppointmentStatus;
          price: number;
          notes: string | null;
          cancelled_at: string | null;
          cancelled_reason: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          barber_id: string;
          service_id: string;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          price: number;
          notes?: string | null;
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          barber_id?: string;
          service_id?: string;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          price?: number;
          notes?: string | null;
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_intents: {
        Row: {
          id: string;
          client_id: string | null;
          appointment_id: string | null;
          subscription_id: string | null;
          amount: number;
          type: PaymentType;
          status: PaymentStatus;
          provider: PaymentProvider;
          provider_ref: string | null;
          provider_checkout_url: string | null;
          provider_qr_code: string | null;
          provider_pix_code: string | null;
          idempotency_key: string;
          metadata: Json;
          paid_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          appointment_id?: string | null;
          subscription_id?: string | null;
          amount: number;
          type?: PaymentType;
          status?: PaymentStatus;
          provider?: PaymentProvider;
          provider_ref?: string | null;
          provider_checkout_url?: string | null;
          provider_qr_code?: string | null;
          provider_pix_code?: string | null;
          idempotency_key: string;
          metadata?: Json;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          appointment_id?: string | null;
          subscription_id?: string | null;
          amount?: number;
          type?: PaymentType;
          status?: PaymentStatus;
          provider?: PaymentProvider;
          provider_ref?: string | null;
          provider_checkout_url?: string | null;
          provider_qr_code?: string | null;
          provider_pix_code?: string | null;
          idempotency_key?: string;
          metadata?: Json;
          paid_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          client_id: string;
          plan_name: string;
          plan_description: string | null;
          monthly_price: number;
          services_included: string[];
          max_uses_per_month: number | null;
          uses_this_month: number;
          status: SubscriptionStatus;
          abacatepay_subscription_id: string | null;
          billing_day: number;
          current_period_start: string | null;
          current_period_end: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          plan_name: string;
          plan_description?: string | null;
          monthly_price: number;
          services_included?: string[];
          max_uses_per_month?: number | null;
          uses_this_month?: number;
          status?: SubscriptionStatus;
          abacatepay_subscription_id?: string | null;
          billing_day?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          plan_name?: string;
          plan_description?: string | null;
          monthly_price?: number;
          services_included?: string[];
          max_uses_per_month?: number | null;
          uses_this_month?: number;
          status?: SubscriptionStatus;
          abacatepay_subscription_id?: string | null;
          billing_day?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ledger_entries: {
        Row: {
          id: string;
          kind: LedgerKind;
          category: LedgerCategory;
          amount: number;
          description: string | null;
          reference_table: string | null;
          reference_id: string | null;
          payment_intent_id: string | null;
          barber_id: string | null;
          balance_after: number | null;
          metadata: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: LedgerKind;
          category: LedgerCategory;
          amount: number;
          description?: string | null;
          reference_table?: string | null;
          reference_id?: string | null;
          payment_intent_id?: string | null;
          barber_id?: string | null;
          balance_after?: number | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: LedgerKind;
          category?: LedgerCategory;
          amount?: number;
          description?: string | null;
          reference_table?: string | null;
          reference_id?: string | null;
          payment_intent_id?: string | null;
          barber_id?: string | null;
          balance_after?: number | null;
          metadata?: Json;
          occurred_at?: string;
          created_at?: string;
        };
      };
      commissions: {
        Row: {
          id: string;
          barber_id: string;
          appointment_id: string | null;
          payment_intent_id: string | null;
          base_amount: number;
          percentage: number;
          commission_amount: number;
          status: CommissionStatus;
          paid_at: string | null;
          period_start: string | null;
          period_end: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barber_id: string;
          appointment_id?: string | null;
          payment_intent_id?: string | null;
          base_amount: number;
          percentage: number;
          commission_amount: number;
          status?: CommissionStatus;
          paid_at?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barber_id?: string;
          appointment_id?: string | null;
          payment_intent_id?: string | null;
          base_amount?: number;
          percentage?: number;
          commission_amount?: number;
          status?: CommissionStatus;
          paid_at?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_type: string;
          provider_event_id: string;
          payload: Json;
          headers: Json | null;
          signature: string | null;
          signature_valid: boolean | null;
          status: WebhookStatus;
          processed_at: string | null;
          error_message: string | null;
          retry_count: number;
          received_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          event_type: string;
          provider_event_id: string;
          payload: Json;
          headers?: Json | null;
          signature?: string | null;
          signature_valid?: boolean | null;
          status?: WebhookStatus;
          processed_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
          received_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          event_type?: string;
          provider_event_id?: string;
          payload?: Json;
          headers?: Json | null;
          signature?: string | null;
          signature_valid?: boolean | null;
          status?: WebhookStatus;
          processed_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
          received_at?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_email: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          actor_email?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      current_balance: {
        Row: {
          balance: number | null;
          total_credits: number | null;
          total_debits: number | null;
        };
      };
    };
    Functions: {
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      check_availability: {
        Args: {
          p_barber_id: string;
          p_start_time: string;
          p_end_time: string;
          p_exclude_appointment_id?: string;
        };
        Returns: boolean;
      };
      get_dashboard_stats: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
        };
        Returns: {
          total_appointments: number;
          completed_appointments: number;
          cancelled_appointments: number;
          total_revenue: number;
          total_commissions: number;
          new_clients: number;
          active_subscriptions: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
      payment_type: PaymentType;
      payment_status: PaymentStatus;
      payment_provider: PaymentProvider;
      subscription_status: SubscriptionStatus;
      ledger_kind: LedgerKind;
      ledger_category: LedgerCategory;
      commission_status: CommissionStatus;
      webhook_status: WebhookStatus;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

