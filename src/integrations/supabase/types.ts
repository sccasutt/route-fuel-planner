export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          diet_type: string | null
          full_name: string | null
          goal_type: string | null
          id: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          diet_type?: string | null
          full_name?: string | null
          goal_type?: string | null
          id: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          diet_type?: string | null
          full_name?: string | null
          goal_type?: string | null
          id?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      route_points: {
        Row: {
          elevation: number | null
          id: number
          lat: number
          lng: number
          recorded_at: string | null
          route_id: string
          sequence_index: number
        }
        Insert: {
          elevation?: number | null
          id?: number
          lat: number
          lng: number
          recorded_at?: string | null
          route_id: string
          sequence_index: number
        }
        Update: {
          elevation?: number | null
          id?: number
          lat?: number
          lng?: number
          recorded_at?: string | null
          route_id?: string
          sequence_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_points_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_weather: {
        Row: {
          conditions: string | null
          created_at: string
          humidity: number | null
          id: string
          route_id: string
          temperature: number | null
          updated_at: string
          wind_speed: number | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          humidity?: number | null
          id?: string
          route_id: string
          temperature?: number | null
          updated_at?: string
          wind_speed?: number | null
        }
        Update: {
          conditions?: string | null
          created_at?: string
          humidity?: number | null
          id?: string
          route_id?: string
          temperature?: number | null
          updated_at?: string
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "route_weather_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          calories: number | null
          calories_estimated: number | null
          calories_power_based: number | null
          carb_grams: number | null
          coordinates: Json | null
          created_at: string
          date: string
          description: string | null
          distance: number
          duration: string
          duration_seconds: number | null
          elevation: number
          fat_grams: number | null
          file_url: string | null
          gpx_data: string | null
          gpx_file_url: string | null
          id: string
          metadata: Json | null
          name: string
          protein_grams: number | null
          start_lat: number | null
          start_lng: number | null
          type: string | null
          updated_at: string
          user_id: string
          wahoo_route_id: string
          weather_json: Json | null
        }
        Insert: {
          calories?: number | null
          calories_estimated?: number | null
          calories_power_based?: number | null
          carb_grams?: number | null
          coordinates?: Json | null
          created_at?: string
          date: string
          description?: string | null
          distance: number
          duration: string
          duration_seconds?: number | null
          elevation: number
          fat_grams?: number | null
          file_url?: string | null
          gpx_data?: string | null
          gpx_file_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          protein_grams?: number | null
          start_lat?: number | null
          start_lng?: number | null
          type?: string | null
          updated_at?: string
          user_id: string
          wahoo_route_id: string
          weather_json?: Json | null
        }
        Update: {
          calories?: number | null
          calories_estimated?: number | null
          calories_power_based?: number | null
          carb_grams?: number | null
          coordinates?: Json | null
          created_at?: string
          date?: string
          description?: string | null
          distance?: number
          duration?: string
          duration_seconds?: number | null
          elevation?: number
          fat_grams?: number | null
          file_url?: string | null
          gpx_data?: string | null
          gpx_file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          protein_grams?: number | null
          start_lat?: number | null
          start_lng?: number | null
          type?: string | null
          updated_at?: string
          user_id?: string
          wahoo_route_id?: string
          weather_json?: Json | null
        }
        Relationships: []
      }
      trackpoints: {
        Row: {
          cadence: number | null
          created_at: string
          elevation: number | null
          heart_rate: number | null
          id: number
          lat: number
          lon: number
          power: number | null
          route_id: string
          time: string | null
        }
        Insert: {
          cadence?: number | null
          created_at?: string
          elevation?: number | null
          heart_rate?: number | null
          id?: number
          lat: number
          lon: number
          power?: number | null
          route_id: string
          time?: string | null
        }
        Update: {
          cadence?: number | null
          created_at?: string
          elevation?: number | null
          heart_rate?: number | null
          id?: number
          lat?: number
          lon?: number
          power?: number | null
          route_id?: string
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trackpoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      wahoo_profiles: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          updated_at: string
          wahoo_user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          id: string
          last_synced_at?: string | null
          updated_at?: string
          wahoo_user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          updated_at?: string
          wahoo_user_id?: string | null
          weight_kg?: number | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
