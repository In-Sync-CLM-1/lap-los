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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_logs: {
        Row: {
          api_name: string
          application_id: string | null
          created_at: string
          error_message: string | null
          id: string
          is_mock: boolean | null
          is_success: boolean | null
          lead_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_name: string
          application_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_mock?: boolean | null
          is_success?: boolean | null
          lead_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_name?: string
          application_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_mock?: boolean | null
          is_success?: boolean | null
          lead_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_number: string
          approved_at: string | null
          approved_by: string | null
          assigned_underwriter_id: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          bre_decision: Database["public"]["Enums"]["decision_type"] | null
          bre_processed_at: string | null
          bre_reasons: Json | null
          bre_score: number | null
          calculated_foir: number | null
          cam_notes: string | null
          cam_recommendation: string | null
          counter_offer_amount: number | null
          counter_offer_approved_by: string | null
          counter_offer_emi: number | null
          counter_offer_interest_rate: number | null
          counter_offer_tenure_months: number | null
          created_at: string
          current_approver_id: string | null
          deviation_approved_by: string | null
          deviation_reason: string | null
          deviation_type: string | null
          disbursed_amount: number | null
          disbursed_at: string | null
          existing_obligations: number | null
          final_amount: number | null
          final_emi: number | null
          final_interest_rate: number | null
          final_tenure_months: number | null
          gross_margin_percent: number | null
          has_deviation: boolean | null
          id: string
          lead_id: string
          max_eligible_emi: number | null
          monthly_expenses: number | null
          monthly_turnover: number | null
          offer1_amount: number | null
          offer1_emi: number | null
          offer1_interest_rate: number | null
          offer1_tenure_months: number | null
          offer2_amount: number | null
          offer2_emi: number | null
          offer2_interest_rate: number | null
          offer2_tenure_months: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          ro_id: string
          sanction_letter_generated_at: string | null
          selected_offer: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          application_number: string
          approved_at?: string | null
          approved_by?: string | null
          assigned_underwriter_id?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bre_decision?: Database["public"]["Enums"]["decision_type"] | null
          bre_processed_at?: string | null
          bre_reasons?: Json | null
          bre_score?: number | null
          calculated_foir?: number | null
          cam_notes?: string | null
          cam_recommendation?: string | null
          counter_offer_amount?: number | null
          counter_offer_approved_by?: string | null
          counter_offer_emi?: number | null
          counter_offer_interest_rate?: number | null
          counter_offer_tenure_months?: number | null
          created_at?: string
          current_approver_id?: string | null
          deviation_approved_by?: string | null
          deviation_reason?: string | null
          deviation_type?: string | null
          disbursed_amount?: number | null
          disbursed_at?: string | null
          existing_obligations?: number | null
          final_amount?: number | null
          final_emi?: number | null
          final_interest_rate?: number | null
          final_tenure_months?: number | null
          gross_margin_percent?: number | null
          has_deviation?: boolean | null
          id?: string
          lead_id: string
          max_eligible_emi?: number | null
          monthly_expenses?: number | null
          monthly_turnover?: number | null
          offer1_amount?: number | null
          offer1_emi?: number | null
          offer1_interest_rate?: number | null
          offer1_tenure_months?: number | null
          offer2_amount?: number | null
          offer2_emi?: number | null
          offer2_interest_rate?: number | null
          offer2_tenure_months?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          ro_id: string
          sanction_letter_generated_at?: string | null
          selected_offer?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          application_number?: string
          approved_at?: string | null
          approved_by?: string | null
          assigned_underwriter_id?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bre_decision?: Database["public"]["Enums"]["decision_type"] | null
          bre_processed_at?: string | null
          bre_reasons?: Json | null
          bre_score?: number | null
          calculated_foir?: number | null
          cam_notes?: string | null
          cam_recommendation?: string | null
          counter_offer_amount?: number | null
          counter_offer_approved_by?: string | null
          counter_offer_emi?: number | null
          counter_offer_interest_rate?: number | null
          counter_offer_tenure_months?: number | null
          created_at?: string
          current_approver_id?: string | null
          deviation_approved_by?: string | null
          deviation_reason?: string | null
          deviation_type?: string | null
          disbursed_amount?: number | null
          disbursed_at?: string | null
          existing_obligations?: number | null
          final_amount?: number | null
          final_emi?: number | null
          final_interest_rate?: number | null
          final_tenure_months?: number | null
          gross_margin_percent?: number | null
          has_deviation?: boolean | null
          id?: string
          lead_id?: string
          max_eligible_emi?: number | null
          monthly_expenses?: number | null
          monthly_turnover?: number | null
          offer1_amount?: number | null
          offer1_emi?: number | null
          offer1_interest_rate?: number | null
          offer1_tenure_months?: number | null
          offer2_amount?: number | null
          offer2_emi?: number | null
          offer2_interest_rate?: number | null
          offer2_tenure_months?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          ro_id?: string
          sanction_letter_generated_at?: string | null
          selected_offer?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_matrix: {
        Row: {
          approval_level: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_amount: number
          min_amount: number
          product_type: Database["public"]["Enums"]["product_type"]
          required_role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          approval_level?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount: number
          min_amount?: number
          product_type: Database["public"]["Enums"]["product_type"]
          required_role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          approval_level?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number
          min_amount?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          required_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      designations: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          mapped_role: Database["public"]["Enums"]["app_role"]
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          mapped_role: Database["public"]["Enums"]["app_role"]
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          mapped_role?: Database["public"]["Enums"]["app_role"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          api_validation_result: Json | null
          application_id: string | null
          capture_address: string | null
          capture_latitude: number | null
          capture_longitude: number | null
          captured_at: string | null
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          is_verified: boolean | null
          lead_id: string | null
          mime_type: string | null
          ocr_data: Json | null
          uploaded_by: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          api_validation_result?: Json | null
          application_id?: string | null
          capture_address?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          captured_at?: string | null
          created_at?: string
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          ocr_data?: Json | null
          uploaded_by: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          api_validation_result?: Json | null
          application_id?: string | null
          capture_address?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          captured_at?: string | null
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          ocr_data?: Json | null
          uploaded_by?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_address: string | null
          business_name: string | null
          business_type: string | null
          business_vintage_years: number | null
          capture_address: string | null
          capture_latitude: number | null
          capture_longitude: number | null
          co_applicant_aadhaar: string | null
          co_applicant_name: string | null
          co_applicant_pan: string | null
          co_applicant_phone: string | null
          co_applicant_relation: string | null
          created_at: string
          customer_aadhaar: string | null
          customer_email: string | null
          customer_name: string
          customer_pan: string | null
          customer_phone: string
          date_of_birth: string | null
          dedupe_checked_at: string | null
          gender: string | null
          gst_number: string | null
          has_property: boolean | null
          id: string
          is_dedupe_clean: boolean | null
          lead_number: string
          lead_score: number | null
          lead_temperature: string | null
          next_followup_at: string | null
          partner_code: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          property_address: string | null
          property_type: string | null
          property_value: number | null
          purpose_of_loan: string | null
          qualification_status: string | null
          requested_amount: number
          requested_tenure_months: number | null
          residence_status: string | null
          ro_id: string
          scoring_factors: Json | null
          source_channel: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tech_source_reference: string | null
          udyam_number: string | null
          updated_at: string
        }
        Insert: {
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          business_vintage_years?: number | null
          capture_address?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          co_applicant_aadhaar?: string | null
          co_applicant_name?: string | null
          co_applicant_pan?: string | null
          co_applicant_phone?: string | null
          co_applicant_relation?: string | null
          created_at?: string
          customer_aadhaar?: string | null
          customer_email?: string | null
          customer_name: string
          customer_pan?: string | null
          customer_phone: string
          date_of_birth?: string | null
          dedupe_checked_at?: string | null
          gender?: string | null
          gst_number?: string | null
          has_property?: boolean | null
          id?: string
          is_dedupe_clean?: boolean | null
          lead_number: string
          lead_score?: number | null
          lead_temperature?: string | null
          next_followup_at?: string | null
          partner_code?: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          property_address?: string | null
          property_type?: string | null
          property_value?: number | null
          purpose_of_loan?: string | null
          qualification_status?: string | null
          requested_amount: number
          requested_tenure_months?: number | null
          residence_status?: string | null
          ro_id: string
          scoring_factors?: Json | null
          source_channel?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tech_source_reference?: string | null
          udyam_number?: string | null
          updated_at?: string
        }
        Update: {
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          business_vintage_years?: number | null
          capture_address?: string | null
          capture_latitude?: number | null
          capture_longitude?: number | null
          co_applicant_aadhaar?: string | null
          co_applicant_name?: string | null
          co_applicant_pan?: string | null
          co_applicant_phone?: string | null
          co_applicant_relation?: string | null
          created_at?: string
          customer_aadhaar?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_pan?: string | null
          customer_phone?: string
          date_of_birth?: string | null
          dedupe_checked_at?: string | null
          gender?: string | null
          gst_number?: string | null
          has_property?: boolean | null
          id?: string
          is_dedupe_clean?: boolean | null
          lead_number?: string
          lead_score?: number | null
          lead_temperature?: string | null
          next_followup_at?: string | null
          partner_code?: string | null
          product_type?: Database["public"]["Enums"]["product_type"]
          property_address?: string | null
          property_type?: string | null
          property_value?: number | null
          purpose_of_loan?: string | null
          qualification_status?: string | null
          requested_amount?: number
          requested_tenure_months?: number | null
          residence_status?: string | null
          ro_id?: string
          scoring_factors?: Json | null
          source_channel?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tech_source_reference?: string | null
          udyam_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offline_queue: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          payload: Json
          retry_count: number | null
          synced: boolean | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          payload: Json
          retry_count?: number | null
          synced?: boolean | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          payload?: Json
          retry_count?: number | null
          synced?: boolean | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_code: string | null
          created_at: string
          department_id: string | null
          designation_id: string | null
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          region: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_code?: string | null
          created_at?: string
          department_id?: string | null
          designation_id?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_code?: string | null
          created_at?: string
          department_id?: string | null
          designation_id?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
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
      workflow_history: {
        Row: {
          action: string
          application_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          notes: string | null
          performed_by: string
          to_status: Database["public"]["Enums"]["application_status"] | null
        }
        Insert: {
          action: string
          application_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          notes?: string | null
          performed_by: string
          to_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Update: {
          action?: string
          application_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          notes?: string | null
          performed_by?: string
          to_status?: Database["public"]["Enums"]["application_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_required_approvers: {
        Args: {
          _amount: number
          _product_type: Database["public"]["Enums"]["product_type"]
        }
        Returns: {
          approval_level: number
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "ro"
        | "credit_officer"
        | "sales_manager"
        | "regional_head"
        | "zonal_head"
        | "ceo"
        | "admin"
      application_status:
        | "draft"
        | "submitted"
        | "bre_processing"
        | "underwriting"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "deviation"
        | "disbursed"
        | "closed"
      decision_type: "stp_approved" | "non_stp" | "rejected" | "deviation"
      lead_status:
        | "new"
        | "in_progress"
        | "documents_pending"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "disbursed"
        | "closed"
      product_type: "business_loan" | "personal_loan" | "stpl" | "po_finance"
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
      app_role: [
        "ro",
        "credit_officer",
        "sales_manager",
        "regional_head",
        "zonal_head",
        "ceo",
        "admin",
      ],
      application_status: [
        "draft",
        "submitted",
        "bre_processing",
        "underwriting",
        "pending_approval",
        "approved",
        "rejected",
        "deviation",
        "disbursed",
        "closed",
      ],
      decision_type: ["stp_approved", "non_stp", "rejected", "deviation"],
      lead_status: [
        "new",
        "in_progress",
        "documents_pending",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "disbursed",
        "closed",
      ],
      product_type: ["business_loan", "personal_loan", "stpl", "po_finance"],
    },
  },
} as const
