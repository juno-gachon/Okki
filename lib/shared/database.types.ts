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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applicant_contacts: {
        Row: {
          collection_consent_id: string
          housing_request_id: string | null
          id: string
          listing_id: string | null
          phone_e164: string
          usage_scope: string
          verification_status: string
        }
        Insert: {
          collection_consent_id: string
          housing_request_id?: string | null
          id?: string
          listing_id?: string | null
          phone_e164: string
          usage_scope?: string
          verification_status?: string
        }
        Update: {
          collection_consent_id?: string
          housing_request_id?: string | null
          id?: string
          listing_id?: string | null
          phone_e164?: string
          usage_scope?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_contacts_collection_consent_id_fkey"
            columns: ["collection_consent_id"]
            isOneToOne: false
            referencedRelation: "consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_contacts_housing_request_id_fkey"
            columns: ["housing_request_id"]
            isOneToOne: true
            referencedRelation: "housing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_contacts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_listing_details: {
        Row: {
          address: string
          approved: string
          area: string
          authority: string
          authority_evidence: string
          bath: string
          building: string
          commission: string
          condition: string
          contact_time: string
          date: string | null
          deposit: number | null
          direction: string
          facilities: string
          fee: number | null
          fee_basis: string
          fee_items: string
          floor: string
          inspection: string
          kitchen: string
          listing_id: string
          max: number | null
          min: number
          name: string
          office: string
          office_address: string
          office_evidence: string
          office_number: string
          parking: string
          public_scope: string
          region: string
          rent: number | null
          repair_date: string | null
          representative: string
          rooms_baths: string
          rules: string
          title: string
          transaction: string
          type: string
          utilities: string
        }
        Insert: {
          address: string
          approved: string
          area: string
          authority: string
          authority_evidence: string
          bath: string
          building: string
          commission: string
          condition: string
          contact_time: string
          date?: string | null
          deposit?: number | null
          direction: string
          facilities: string
          fee?: number | null
          fee_basis: string
          fee_items: string
          floor: string
          inspection: string
          kitchen: string
          listing_id: string
          max?: number | null
          min: number
          name: string
          office: string
          office_address: string
          office_evidence: string
          office_number: string
          parking: string
          public_scope: string
          region: string
          rent?: number | null
          repair_date?: string | null
          representative: string
          rooms_baths: string
          rules: string
          title: string
          transaction: string
          type: string
          utilities: string
        }
        Update: {
          address?: string
          approved?: string
          area?: string
          authority?: string
          authority_evidence?: string
          bath?: string
          building?: string
          commission?: string
          condition?: string
          contact_time?: string
          date?: string | null
          deposit?: number | null
          direction?: string
          facilities?: string
          fee?: number | null
          fee_basis?: string
          fee_items?: string
          floor?: string
          inspection?: string
          kitchen?: string
          listing_id?: string
          max?: number | null
          min?: number
          name?: string
          office?: string
          office_address?: string
          office_evidence?: string
          office_number?: string
          parking?: string
          public_scope?: string
          region?: string
          rent?: number | null
          repair_date?: string | null
          representative?: string
          rooms_baths?: string
          rules?: string
          title?: string
          transaction?: string
          type?: string
          utilities?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_listing_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string
          attested_truth: boolean
          attested_updates: boolean
          housing_request_id: string | null
          id: string
          listing_id: string | null
          owner_user_id: string
          policy_version: string
          purpose: string
        }
        Insert: {
          accepted_at?: string
          attested_truth?: boolean
          attested_updates?: boolean
          housing_request_id?: string | null
          id?: string
          listing_id?: string | null
          owner_user_id: string
          policy_version: string
          purpose: string
        }
        Update: {
          accepted_at?: string
          attested_truth?: boolean
          attested_updates?: boolean
          housing_request_id?: string | null
          id?: string
          listing_id?: string | null
          owner_user_id?: string
          policy_version?: string
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_housing_request_id_fkey"
            columns: ["housing_request_id"]
            isOneToOne: false
            referencedRelation: "housing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_requests: {
        Row: {
          any_region: boolean
          bath: string | null
          budget: number | null
          commute: number | null
          created_at: string
          date: string | null
          delete_after: string
          deposit: number | null
          duration: string | null
          id: string
          kitchen: string | null
          latest_date: string | null
          must: string | null
          owner_user_id: string
          preferences: string | null
          regions: string[] | null
          seeker_id: string
          sharing: string | null
          situation: string
          start_date: string | null
          status: string
          transport: string | null
          types: string[] | null
          updated_at: string
          version: number
          work_region: string | null
          work_village: string | null
        }
        Insert: {
          any_region: boolean
          bath?: string | null
          budget?: number | null
          commute?: number | null
          created_at?: string
          date?: string | null
          delete_after?: string
          deposit?: number | null
          duration?: string | null
          id?: string
          kitchen?: string | null
          latest_date?: string | null
          must?: string | null
          owner_user_id: string
          preferences?: string | null
          regions?: string[] | null
          seeker_id: string
          sharing?: string | null
          situation: string
          start_date?: string | null
          status?: string
          transport?: string | null
          types?: string[] | null
          updated_at?: string
          version?: number
          work_region?: string | null
          work_village?: string | null
        }
        Update: {
          any_region?: boolean
          bath?: string | null
          budget?: number | null
          commute?: number | null
          created_at?: string
          date?: string | null
          delete_after?: string
          deposit?: number | null
          duration?: string | null
          id?: string
          kitchen?: string | null
          latest_date?: string | null
          must?: string | null
          owner_user_id?: string
          preferences?: string | null
          regions?: string[] | null
          seeker_id?: string
          sharing?: string | null
          situation?: string
          start_date?: string | null
          status?: string
          transport?: string | null
          types?: string[] | null
          updated_at?: string
          version?: number
          work_region?: string | null
          work_village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "housing_requests_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: true
            referencedRelation: "seekers"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_records: {
        Row: {
          created_at: string
          key: string
          operation: string
          owner_user_id: string
          request_hash: string
          result: Json
        }
        Insert: {
          created_at?: string
          key: string
          operation: string
          owner_user_id: string
          request_hash: string
          result: Json
        }
        Update: {
          created_at?: string
          key?: string
          operation?: string
          owner_user_id?: string
          request_hash?: string
          result?: Json
        }
        Relationships: []
      }
      listing_media: {
        Row: {
          byte_size: number | null
          created_at: string
          expires_at: string
          id: string
          listing_id: string | null
          object_path: string
          owner_user_id: string
          status: string
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string | null
          object_path: string
          owner_user_id: string
          status?: string
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string | null
          object_path?: string
          owner_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          created_at: string
          delete_after: string
          id: string
          kind: string
          lifecycle_status: string
          owner_user_id: string
          provider_id: string
          review_status: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          delete_after?: string
          id?: string
          kind: string
          lifecycle_status?: string
          owner_user_id: string
          provider_id: string
          review_status: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          delete_after?: string
          id?: string
          kind?: string
          lifecycle_status?: string
          owner_user_id?: string
          provider_id?: string
          review_status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          account_status: string
          auth_user_id: string
          created_at: string
          id: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          account_status?: string
          auth_user_id: string
          created_at?: string
          id?: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          account_status?: string
          auth_user_id?: string
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      seekers: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          updated_at: string
          version: number
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          updated_at?: string
          version?: number
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      shared_housing_details: {
        Row: {
          address: string
          authority: string
          authority_evidence: string
          bath: string
          contact_time: string
          current_people: number
          date: string | null
          deposit: number | null
          end_date: string | null
          fee: number | null
          intro: string | null
          kitchen: string
          listing_id: string
          living_rules: string
          meal: string | null
          min: number
          name: string | null
          recruit_people: number
          region: string
          rent: number | null
          residency: string
          room_area: string
          rules: string
          sleeping: string
          title: string
          type: string
          utilities: string
        }
        Insert: {
          address: string
          authority: string
          authority_evidence: string
          bath: string
          contact_time: string
          current_people: number
          date?: string | null
          deposit?: number | null
          end_date?: string | null
          fee?: number | null
          intro?: string | null
          kitchen: string
          listing_id: string
          living_rules: string
          meal?: string | null
          min: number
          name?: string | null
          recruit_people: number
          region: string
          rent?: number | null
          residency: string
          room_area: string
          rules: string
          sleeping: string
          title: string
          type: string
          utilities: string
        }
        Update: {
          address?: string
          authority?: string
          authority_evidence?: string
          bath?: string
          contact_time?: string
          current_people?: number
          date?: string | null
          deposit?: number | null
          end_date?: string | null
          fee?: number | null
          intro?: string | null
          kitchen?: string
          listing_id?: string
          living_rules?: string
          meal?: string | null
          min?: number
          name?: string | null
          recruit_people?: number
          region?: string
          rent?: number | null
          residency?: string
          room_area?: string
          rules?: string
          sleeping?: string
          title?: string
          type?: string
          utilities?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_housing_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancy_report_details: {
        Row: {
          address: string
          certainty: string
          condition_note: string | null
          contact_time: string
          contract_end: string | null
          current_fee: string | null
          current_resident: boolean
          date_range: string | null
          deposit: number | null
          landlord_intent: string
          landlord_notified: string
          landlord_response: string | null
          leave_date: string | null
          listing_id: string
          name: string | null
          notice_method: string | null
          notified_at: string | null
          planned_notice_at: string | null
          region: string
          rent: number | null
          timing_note: string | null
          type: string
        }
        Insert: {
          address: string
          certainty: string
          condition_note?: string | null
          contact_time: string
          contract_end?: string | null
          current_fee?: string | null
          current_resident: boolean
          date_range?: string | null
          deposit?: number | null
          landlord_intent: string
          landlord_notified: string
          landlord_response?: string | null
          leave_date?: string | null
          listing_id: string
          name?: string | null
          notice_method?: string | null
          notified_at?: string | null
          planned_notice_at?: string | null
          region: string
          rent?: number | null
          timing_note?: string | null
          type: string
        }
        Update: {
          address?: string
          certainty?: string
          condition_note?: string | null
          contact_time?: string
          contract_end?: string | null
          current_fee?: string | null
          current_resident?: boolean
          date_range?: string | null
          deposit?: number | null
          landlord_intent?: string
          landlord_notified?: string
          landlord_response?: string | null
          leave_date?: string | null
          listing_id?: string
          name?: string | null
          notice_method?: string | null
          notified_at?: string | null
          planned_notice_at?: string | null
          region?: string
          rent?: number | null
          timing_note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_report_details_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_intake: {
        Args: {
          p_actor: string
          p_id: string
          p_kind: string
          p_version: number
        }
        Returns: undefined
      }
      reserve_intake_media: {
        Args: { p_actor: string; p_id: string; p_path: string }
        Returns: undefined
      }
      save_intake: {
        Args: {
          p_actor: string
          p_data: Json
          p_hash: string
          p_id: string
          p_key: string
          p_kind: string
          p_media: string[]
          p_optional: boolean
          p_phone: string
          p_version: number
        }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

