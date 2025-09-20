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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_predictions: {
        Row: {
          actual_period_start: string | null
          created_at: string
          cycle_length: number | null
          cycle_start_date: string
          id: string
          is_predicted: boolean | null
          predicted_fertile_window_end: string
          predicted_fertile_window_start: string
          predicted_ovulation: string
          predicted_period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_period_start?: string | null
          created_at?: string
          cycle_length?: number | null
          cycle_start_date: string
          id?: string
          is_predicted?: boolean | null
          predicted_fertile_window_end: string
          predicted_fertile_window_start: string
          predicted_ovulation: string
          predicted_period_start: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_period_start?: string | null
          created_at?: string
          cycle_length?: number | null
          cycle_start_date?: string
          id?: string
          is_predicted?: boolean | null
          predicted_fertile_window_end?: string
          predicted_fertile_window_start?: string
          predicted_ovulation?: string
          predicted_period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          cravings: string[] | null
          created_at: string
          energy_level: string | null
          exercise_minutes: number | null
          exercise_type: string | null
          flow_intensity: string | null
          food_log: string | null
          id: string
          log_date: string
          medications: string[] | null
          mood: string | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: string | null
          stress_level: number | null
          supplements: string[] | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          water_intake_ml: number | null
          weight_kg: number | null
        }
        Insert: {
          cravings?: string[] | null
          created_at?: string
          energy_level?: string | null
          exercise_minutes?: number | null
          exercise_type?: string | null
          flow_intensity?: string | null
          food_log?: string | null
          id?: string
          log_date?: string
          medications?: string[] | null
          mood?: string | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: number | null
          supplements?: string[] | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          water_intake_ml?: number | null
          weight_kg?: number | null
        }
        Update: {
          cravings?: string[] | null
          created_at?: string
          energy_level?: string | null
          exercise_minutes?: number | null
          exercise_type?: string | null
          flow_intensity?: string | null
          food_log?: string | null
          id?: string
          log_date?: string
          medications?: string[] | null
          mood?: string | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: number | null
          supplements?: string[] | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          water_intake_ml?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      health_data: {
        Row: {
          activity_level: string | null
          ai_insights: Json | null
          allergies: string[] | null
          blood_type: string | null
          cravings: string[] | null
          created_at: string
          dietary_preferences: string[] | null
          energy_level: string | null
          exercise_minutes: number | null
          flow_intensity: string | null
          food_log: string | null
          health_goals: string[] | null
          height_cm: number | null
          id: string
          logged_date: string | null
          medical_conditions: string[] | null
          medications: string[] | null
          mood: string | null
          sleep_hours: number | null
          sleep_quality: string | null
          stress_level: number | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
          water_intake_ml: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          ai_insights?: Json | null
          allergies?: string[] | null
          blood_type?: string | null
          cravings?: string[] | null
          created_at?: string
          dietary_preferences?: string[] | null
          energy_level?: string | null
          exercise_minutes?: number | null
          flow_intensity?: string | null
          food_log?: string | null
          health_goals?: string[] | null
          height_cm?: number | null
          id?: string
          logged_date?: string | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          mood?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
          water_intake_ml?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          ai_insights?: Json | null
          allergies?: string[] | null
          blood_type?: string | null
          cravings?: string[] | null
          created_at?: string
          dietary_preferences?: string[] | null
          energy_level?: string | null
          exercise_minutes?: number | null
          flow_intensity?: string | null
          food_log?: string | null
          health_goals?: string[] | null
          height_cm?: number | null
          id?: string
          logged_date?: string | null
          medical_conditions?: string[] | null
          medications?: string[] | null
          mood?: string | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          stress_level?: number | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
          water_intake_ml?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          cycle_length: number | null
          emergency_contact: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_period_start: string | null
          location: string | null
          period_duration: number | null
          phone: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          cycle_length?: number | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_period_start?: string | null
          location?: string | null
          period_duration?: number | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          cycle_length?: number | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_period_start?: string | null
          location?: string | null
          period_duration?: number | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          frequency: string | null
          id: string
          is_active: boolean | null
          is_sent: boolean | null
          message: string | null
          reminder_date: string
          reminder_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_date: string
          reminder_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_date?: string
          reminder_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
