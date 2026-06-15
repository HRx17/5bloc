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
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_signups: {
        Row: {
          bio: string | null
          business_name: string
          city: string
          contact_name: string
          country: string
          created_at: string
          email: string
          id: string
          phone: string | null
          photos: string[]
          source: string | null
          specializations: string[]
          state: string | null
          status: string
          team_size: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          business_name: string
          city: string
          contact_name: string
          country?: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          photos?: string[]
          source?: string | null
          specializations?: string[]
          state?: string | null
          status?: string
          team_size?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          business_name?: string
          city?: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          photos?: string[]
          source?: string | null
          specializations?: string[]
          state?: string | null
          status?: string
          team_size?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      vendor_signups: {
        Row: {
          bio: string | null
          business_name: string
          categories: string[]
          city: string
          contact_name: string
          country: string
          created_at: string
          email: string
          id: string
          phone: string | null
          photos: string[]
          source: string | null
          state: string | null
          status: string
          team_size: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          business_name: string
          categories?: string[]
          city: string
          contact_name: string
          country?: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          photos?: string[]
          source?: string | null
          state?: string | null
          status?: string
          team_size?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          business_name?: string
          categories?: string[]
          city?: string
          contact_name?: string
          country?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          photos?: string[]
          source?: string | null
          state?: string | null
          status?: string
          team_size?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string
          org_id: string | null
          project_id: string | null
          title: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          org_id?: string | null
          project_id?: string | null
          title?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          org_id?: string | null
          project_id?: string | null
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          profile_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          profile_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string | null
          id: string
          is_template: boolean | null
          org_id: string
          original_filename: string
          phase: string | null
          project_id: string | null
          status: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_template?: boolean | null
          org_id: string
          original_filename: string
          phase?: string | null
          project_id?: string | null
          status?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_template?: boolean | null
          org_id?: string
          original_filename?: string
          phase?: string | null
          project_id?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_name: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          org_id: string
          project_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          client_name: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          org_id: string
          project_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_name?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          org_id?: string
          project_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          date_reported: string | null
          description: string | null
          id: string
          is_template: boolean | null
          issue_number: number
          org_id: string
          photo_attached: string | null
          project_id: string
          reported_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          id?: string
          is_template?: boolean | null
          issue_number?: number
          org_id: string
          photo_attached?: string | null
          project_id: string
          reported_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          id?: string
          is_template?: boolean | null
          issue_number?: number
          org_id?: string
          photo_attached?: string | null
          project_id?: string
          reported_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          plan: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          plan?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_milestones: {
        Row: {
          completion: number | null
          created_at: string | null
          fee: number | null
          id: string
          is_template: boolean | null
          label: string | null
          milestone_date: string | null
          notes: string | null
          org_id: string
          paid: boolean | null
          phase_key: string
          project_id: string
          rera_certified: boolean | null
          updated_at: string | null
        }
        Insert: {
          completion?: number | null
          created_at?: string | null
          fee?: number | null
          id?: string
          is_template?: boolean | null
          label?: string | null
          milestone_date?: string | null
          notes?: string | null
          org_id: string
          paid?: boolean | null
          phase_key: string
          project_id: string
          rera_certified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          completion?: number | null
          created_at?: string | null
          fee?: number | null
          id?: string
          is_template?: boolean | null
          label?: string | null
          milestone_date?: string | null
          notes?: string | null
          org_id?: string
          paid?: boolean | null
          phase_key?: string
          project_id?: string
          rera_certified?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_add_on: boolean
          auth_id: string
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          org_id: string | null
          plan: string
          role: string
          updated_at: string
        }
        Insert: {
          ai_add_on?: boolean
          auth_id: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Update: {
          ai_add_on?: boolean
          auth_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          org_id?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          project_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          project_id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          architect_fee: number | null
          architect_fee_pct: number | null
          brief: string | null
          budget: number | null
          city: string | null
          client_name: string | null
          construction_cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          floors: number | null
          id: string
          is_rera_registered: boolean | null
          is_template: boolean | null
          name: string
          org_id: string
          phase: number
          phase_key: string | null
          start_date: string | null
          state: string | null
          status: string
          total_sqft: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          architect_fee?: number | null
          architect_fee_pct?: number | null
          brief?: string | null
          budget?: number | null
          city?: string | null
          client_name?: string | null
          construction_cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          floors?: number | null
          id?: string
          is_rera_registered?: boolean | null
          is_template?: boolean | null
          name: string
          org_id: string
          phase?: number
          phase_key?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          total_sqft?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          architect_fee?: number | null
          architect_fee_pct?: number | null
          brief?: string | null
          budget?: number | null
          city?: string | null
          client_name?: string | null
          construction_cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          floors?: number | null
          id?: string
          is_rera_registered?: boolean | null
          is_template?: boolean | null
          name?: string
          org_id?: string
          phase?: number
          phase_key?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          total_sqft?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          drawing_ref: string | null
          due_date: string | null
          id: string
          is_scope_change: boolean | null
          is_template: boolean | null
          org_id: string
          project_id: string
          raised_by: string | null
          response: string | null
          rfi_number: number
          scope_change_amount: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          drawing_ref?: string | null
          due_date?: string | null
          id?: string
          is_scope_change?: boolean | null
          is_template?: boolean | null
          org_id: string
          project_id: string
          raised_by?: string | null
          response?: string | null
          rfi_number?: number
          scope_change_amount?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          drawing_ref?: string | null
          due_date?: string | null
          id?: string
          is_scope_change?: boolean | null
          is_template?: boolean | null
          org_id?: string
          project_id?: string
          raised_by?: string | null
          response?: string | null
          rfi_number?: number
          scope_change_amount?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          contractor: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          file_name: string | null
          id: string
          is_template: boolean | null
          org_id: string
          project_id: string
          review_note: string | null
          revision: number | null
          spec_section: string | null
          status: string
          submittal_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          contractor?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          id?: string
          is_template?: boolean | null
          org_id: string
          project_id: string
          review_note?: string | null
          revision?: number | null
          spec_section?: string | null
          status?: string
          submittal_number?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          contractor?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          id?: string
          is_template?: boolean | null
          org_id?: string
          project_id?: string
          review_note?: string | null
          revision?: number | null
          spec_section?: string | null
          status?: string
          submittal_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string
          connected_at: string | null
          expires_at: string | null
          id: string
          provider: string
          provider_email: string | null
          provider_name: string | null
          refresh_token: string | null
          scope: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          provider_email?: string | null
          provider_name?: string | null
          refresh_token?: string | null
          scope?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          provider_email?: string | null
          provider_name?: string | null
          refresh_token?: string | null
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          firm: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          firm?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          firm?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          direction: string
          filename: string | null
          from_number: string
          id: string
          media_id: string | null
          message_id: string
          received_at: string | null
          status: string | null
          text: string | null
          to_number: string | null
          type: string | null
        }
        Insert: {
          direction?: string
          filename?: string | null
          from_number: string
          id?: string
          media_id?: string | null
          message_id: string
          received_at?: string | null
          status?: string | null
          text?: string | null
          to_number?: string | null
          type?: string | null
        }
        Update: {
          direction?: string
          filename?: string | null
          from_number?: string
          id?: string
          media_id?: string | null
          message_id?: string
          received_at?: string | null
          status?: string | null
          text?: string | null
          to_number?: string | null
          type?: string | null
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
