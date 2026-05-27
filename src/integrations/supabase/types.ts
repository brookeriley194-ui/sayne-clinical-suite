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
      patient_links: {
        Row: {
          created_at: string
          doctor_id: string
          expires_at: string | null
          id: string
          patient_email: string | null
          patient_name: string
          protocol_id: string
          token: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          expires_at?: string | null
          id?: string
          patient_email?: string | null
          patient_name: string
          protocol_id: string
          token: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          expires_at?: string | null
          id?: string
          patient_email?: string | null
          patient_name?: string
          protocol_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_links_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          compound: string
          created_at: string
          doctor_id: string
          dose: number
          dose_unit: string
          duration_days: number | null
          fasted: boolean
          frequency: string
          id: string
          name: string
          notes: string | null
          ongoing: boolean
          route: string
          source: string
          time_of_day: string
          updated_at: string
          vial_id: string | null
        }
        Insert: {
          compound: string
          created_at?: string
          doctor_id: string
          dose: number
          dose_unit: string
          duration_days?: number | null
          fasted?: boolean
          frequency: string
          id?: string
          name: string
          notes?: string | null
          ongoing?: boolean
          route: string
          source?: string
          time_of_day?: string
          updated_at?: string
          vial_id?: string | null
        }
        Update: {
          compound?: string
          created_at?: string
          doctor_id?: string
          dose?: number
          dose_unit?: string
          duration_days?: number | null
          fasted?: boolean
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          ongoing?: boolean
          route?: string
          source?: string
          time_of_day?: string
          updated_at?: string
          vial_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocols_vial_id_fkey"
            columns: ["vial_id"]
            isOneToOne: false
            referencedRelation: "vials"
            referencedColumns: ["id"]
          },
        ]
      }
      stack_doses: {
        Row: {
          created_at: string
          doctor_id: string
          dose_date: string
          id: string
          period: string
          stack_id: string
          taken_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dose_date: string
          id?: string
          period?: string
          stack_id: string
          taken_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dose_date?: string
          id?: string
          period?: string
          stack_id?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stack_doses_stack_id_fkey"
            columns: ["stack_id"]
            isOneToOne: false
            referencedRelation: "stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      stacks: {
        Row: {
          created_at: string
          cycle_length_days: number
          doctor_id: string
          dose: number | null
          dose_unit: string
          fasted: boolean
          frequency: string
          id: string
          notes: string | null
          peptide_name: string
          reconstituted_at: string | null
          start_date: string
          time_of_day: string
          updated_at: string
          vial_id: string | null
        }
        Insert: {
          created_at?: string
          cycle_length_days?: number
          doctor_id: string
          dose?: number | null
          dose_unit?: string
          fasted?: boolean
          frequency?: string
          id?: string
          notes?: string | null
          peptide_name: string
          reconstituted_at?: string | null
          start_date?: string
          time_of_day?: string
          updated_at?: string
          vial_id?: string | null
        }
        Update: {
          created_at?: string
          cycle_length_days?: number
          doctor_id?: string
          dose?: number | null
          dose_unit?: string
          fasted?: boolean
          frequency?: string
          id?: string
          notes?: string | null
          peptide_name?: string
          reconstituted_at?: string | null
          start_date?: string
          time_of_day?: string
          updated_at?: string
          vial_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stacks_vial_id_fkey"
            columns: ["vial_id"]
            isOneToOne: false
            referencedRelation: "vials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vials: {
        Row: {
          bac_water_ml: number | null
          compound: string
          concentration_mg_per_ml: number | null
          created_at: string
          default_dose: number | null
          default_dose_unit: string | null
          doctor_id: string
          id: string
          lot_number: string | null
          notes: string | null
          reconstituted_at: string | null
          status: string
          updated_at: string
          vial_size_mg: number
        }
        Insert: {
          bac_water_ml?: number | null
          compound: string
          concentration_mg_per_ml?: number | null
          created_at?: string
          default_dose?: number | null
          default_dose_unit?: string | null
          doctor_id: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          reconstituted_at?: string | null
          status?: string
          updated_at?: string
          vial_size_mg: number
        }
        Update: {
          bac_water_ml?: number | null
          compound?: string
          concentration_mg_per_ml?: number | null
          created_at?: string
          default_dose?: number | null
          default_dose_unit?: string | null
          doctor_id?: string
          id?: string
          lot_number?: string | null
          notes?: string | null
          reconstituted_at?: string | null
          status?: string
          updated_at?: string
          vial_size_mg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "doctor" | "researcher"
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
      app_role: ["doctor", "researcher"],
    },
  },
} as const
