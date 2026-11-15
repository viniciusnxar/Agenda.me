// Tipos do banco no formato do `supabase gen types typescript`.
// Escrito a partir de supabase/migrations/0001_init.sql; regenere com `npm run db:types`
// depois de `npx supabase link`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          blocked_until: string;
          cancel_token: string;
          cancelled_at: string | null;
          client_cpf: string | null;
          client_name: string;
          client_phone: string;
          consent_at: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          notes: string | null;
          plan_id: string | null;
          plan_name: string | null;
          profile_id: string;
          source: string;
          starts_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          blocked_until: string;
          cancel_token?: string;
          cancelled_at?: string | null;
          client_cpf?: string | null;
          client_name: string;
          client_phone: string;
          consent_at?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          notes?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          profile_id: string;
          source?: string;
          starts_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          blocked_until?: string;
          cancel_token?: string;
          cancelled_at?: string | null;
          client_cpf?: string | null;
          client_name?: string;
          client_phone?: string;
          consent_at?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          notes?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          profile_id?: string;
          source?: string;
          starts_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_exceptions: {
        Row: {
          created_at: string;
          date: string;
          end_time: string | null;
          id: string;
          is_blocked: boolean;
          profile_id: string;
          reason: string | null;
          start_time: string | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          end_time?: string | null;
          id?: string;
          is_blocked?: boolean;
          profile_id: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          end_time?: string | null;
          id?: string;
          is_blocked?: boolean;
          profile_id?: string;
          reason?: string | null;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          profile_id: string;
          start_time: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          profile_id: string;
          start_time: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          profile_id?: string;
          start_time?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_settings: {
        Row: {
          allow_private: boolean;
          auto_confirm: boolean;
          buffer_min: number;
          is_enabled: boolean;
          max_advance_days: number;
          max_per_day: number | null;
          min_advance_days: number;
          min_notice_minutes: number;
          plans_enabled: boolean;
          profile_id: string;
          require_cpf: boolean;
          require_plan: boolean;
          slot_duration_min: number;
          updated_at: string;
          whatsapp_enabled: boolean;
          whatsapp_hold_slot: boolean;
          whatsapp_message_template: string;
          window_mode: string;
        };
        Insert: {
          allow_private?: boolean;
          auto_confirm?: boolean;
          buffer_min?: number;
          is_enabled?: boolean;
          max_advance_days?: number;
          max_per_day?: number | null;
          min_advance_days?: number;
          min_notice_minutes?: number;
          plans_enabled?: boolean;
          profile_id: string;
          require_cpf?: boolean;
          require_plan?: boolean;
          slot_duration_min?: number;
          updated_at?: string;
          whatsapp_enabled?: boolean;
          whatsapp_hold_slot?: boolean;
          whatsapp_message_template?: string;
          window_mode?: string;
        };
        Update: {
          allow_private?: boolean;
          auto_confirm?: boolean;
          buffer_min?: number;
          is_enabled?: boolean;
          max_advance_days?: number;
          max_per_day?: number | null;
          min_advance_days?: number;
          min_notice_minutes?: number;
          plans_enabled?: boolean;
          profile_id?: string;
          require_cpf?: boolean;
          require_plan?: boolean;
          slot_duration_min?: number;
          updated_at?: string;
          whatsapp_enabled?: boolean;
          whatsapp_hold_slot?: boolean;
          whatsapp_message_template?: string;
          window_mode?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_settings_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          position: number;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          position?: number;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          position?: number;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plans_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string;
          id: string;
          is_published: boolean;
          profession: string | null;
          registration: string | null;
          theme: string;
          timezone: string;
          updated_at: string;
          username: string;
          whatsapp: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          is_published?: boolean;
          profession?: string | null;
          registration?: string | null;
          theme?: string;
          timezone?: string;
          updated_at?: string;
          username: string;
          whatsapp?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_published?: boolean;
          profession?: string | null;
          registration?: string | null;
          theme?: string;
          timezone?: string;
          updated_at?: string;
          username?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          label: string | null;
          platform: string;
          position: number;
          profile_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          platform: string;
          position?: number;
          profile_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          platform?: string;
          position?: number;
          profile_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_links_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_busy_ranges: {
        Args: { p_from: string; p_profile_id: string; p_to: string };
        Returns: {
          blocked_until: string;
          starts_at: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"];
