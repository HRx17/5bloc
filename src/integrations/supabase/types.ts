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
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_log_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_log_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_log_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_log_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_estimates: {
        Row: {
          breakdown: Json | null
          city: string | null
          created_at: string
          estimated_total: number | null
          floors: number | null
          id: string
          input: Json | null
          org_id: string | null
          profile_id: string | null
          project_id: string | null
          project_type: string | null
          result: Json | null
          spec_level: string | null
          total_sqft: number | null
          user_id: string | null
        }
        Insert: {
          breakdown?: Json | null
          city?: string | null
          created_at?: string
          estimated_total?: number | null
          floors?: number | null
          id?: string
          input?: Json | null
          org_id?: string | null
          profile_id?: string | null
          project_id?: string | null
          project_type?: string | null
          result?: Json | null
          spec_level?: string | null
          total_sqft?: number | null
          user_id?: string | null
        }
        Update: {
          breakdown?: Json | null
          city?: string | null
          created_at?: string
          estimated_total?: number | null
          floors?: number | null
          id?: string
          input?: Json | null
          org_id?: string | null
          profile_id?: string | null
          project_id?: string | null
          project_type?: string | null
          result?: Json | null
          spec_level?: string | null
          total_sqft?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_estimates_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_estimates_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_estimates_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_estimates_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_estimates_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_estimates_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          boq_url: string | null
          contractor_id: string
          created_at: string | null
          id: string
          methodology: string | null
          razorpay_payment_id: string | null
          rejection_note: string | null
          status: string | null
          tender_id: string
          timeline_weeks: number | null
        }
        Insert: {
          amount: number
          boq_url?: string | null
          contractor_id: string
          created_at?: string | null
          id?: string
          methodology?: string | null
          razorpay_payment_id?: string | null
          rejection_note?: string | null
          status?: string | null
          tender_id: string
          timeline_weeks?: number | null
        }
        Update: {
          amount?: number
          boq_url?: string | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          methodology?: string | null
          razorpay_payment_id?: string | null
          rejection_note?: string | null
          status?: string | null
          tender_id?: string
          timeline_weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bids_contractor_id"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bids_tender_id"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      cad_models: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          name: string
          org_id: string
          project_id: string | null
          status: string
          updated_at: string
          urn: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          name: string
          org_id: string
          project_id?: string | null
          status?: string
          updated_at?: string
          urn: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          name?: string
          org_id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          urn?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cad_models_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cad_models_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cad_models_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cad_models_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          interaction_date: string | null
          org_id: string
          summary: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_date?: string | null
          org_id: string
          summary: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_date?: string | null
          org_id?: string
          summary?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_interactions_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_interactions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_interactions_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_interactions_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_settings: {
        Row: {
          project_id: string
          show_approvals: boolean | null
          show_documents: boolean | null
          show_drawings: boolean | null
          show_overview: boolean | null
          show_payments: boolean | null
          show_questions: boolean | null
          show_site: boolean | null
          updated_at: string | null
          welcome_note: string | null
        }
        Insert: {
          project_id: string
          show_approvals?: boolean | null
          show_documents?: boolean | null
          show_drawings?: boolean | null
          show_overview?: boolean | null
          show_payments?: boolean | null
          show_questions?: boolean | null
          show_site?: boolean | null
          updated_at?: string | null
          welcome_note?: string | null
        }
        Update: {
          project_id?: string
          show_approvals?: boolean | null
          show_documents?: boolean | null
          show_drawings?: boolean | null
          show_overview?: boolean | null
          show_payments?: boolean | null
          show_questions?: boolean | null
          show_site?: boolean | null
          updated_at?: string | null
          welcome_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_portal_settings_project_id"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          pipeline_stage: string | null
          state: string | null
          total_value: number | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          pipeline_stage?: string | null
          state?: string | null
          total_value?: number | null
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          pipeline_stage?: string | null
          state?: string | null
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_payments: {
        Row: {
          amount: number
          consultant_name: string
          created_at: string
          created_by: string | null
          discipline: string | null
          due_date: string | null
          id: string
          milestone_phase: string | null
          org_id: string | null
          paid_date: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          consultant_name: string
          created_at?: string
          created_by?: string | null
          discipline?: string | null
          due_date?: string | null
          id?: string
          milestone_phase?: string | null
          org_id?: string | null
          paid_date?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          consultant_name?: string
          created_at?: string
          created_by?: string | null
          discipline?: string | null
          due_date?: string | null
          id?: string
          milestone_phase?: string | null
          org_id?: string | null
          paid_date?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consultant_payments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consultant_payments_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consultant_payments_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consultant_payments_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_reviews: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          project_id: string | null
          rating: number
          review_text: string | null
          reviewer_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          rating: number
          review_text?: string | null
          reviewer_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          project_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contractor_reviews_contractor_id"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contractor_reviews_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contractor_reviews_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contractor_reviews_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          country: string | null
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
          country?: string | null
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
          country?: string | null
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
      contractors: {
        Row: {
          badge_active: boolean | null
          bio: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          gst_number: string | null
          id: string
          jobs_completed: number | null
          listing_type: string | null
          phone: string | null
          portfolio_photos: string[] | null
          rating: number | null
          razorpay_subscription_id: string | null
          reviews_count: number | null
          service_cities: string[]
          service_states: string[] | null
          source: string | null
          source_signup_id: string | null
          source_table: string | null
          specializations: string[]
          state: string | null
          supply_categories: string[]
          team_size: number | null
          team_size_label: string | null
          user_id: string | null
          verified: boolean | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          badge_active?: boolean | null
          bio?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          gst_number?: string | null
          id?: string
          jobs_completed?: number | null
          listing_type?: string | null
          phone?: string | null
          portfolio_photos?: string[] | null
          rating?: number | null
          razorpay_subscription_id?: string | null
          reviews_count?: number | null
          service_cities?: string[]
          service_states?: string[] | null
          source?: string | null
          source_signup_id?: string | null
          source_table?: string | null
          specializations?: string[]
          state?: string | null
          supply_categories?: string[]
          team_size?: number | null
          team_size_label?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          badge_active?: boolean | null
          bio?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          gst_number?: string | null
          id?: string
          jobs_completed?: number | null
          listing_type?: string | null
          phone?: string | null
          portfolio_photos?: string[] | null
          rating?: number | null
          razorpay_subscription_id?: string | null
          reviews_count?: number | null
          service_cities?: string[]
          service_states?: string[] | null
          source?: string | null
          source_signup_id?: string | null
          source_table?: string | null
          specializations?: string[]
          state?: string | null
          supply_categories?: string[]
          team_size?: number | null
          team_size_label?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contractors_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contractors_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_invites: {
        Row: {
          accepted_at: string | null
          conversation_id: string
          created_at: string
          email: string
          id: string
          invited_by: string
        }
        Insert: {
          accepted_at?: string | null
          conversation_id: string
          created_at?: string
          email: string
          id?: string
          invited_by: string
        }
        Update: {
          accepted_at?: string | null
          conversation_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation_invites_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_invites_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_invites_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_conversation_members_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          org_id?: string | null
          project_id?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          org_id?: string | null
          project_id?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversations_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item: string
          notes: string | null
          org_id: string
          project_id: string
          quantity: string | null
          scheduled_date: string | null
          status: string
          vendor_email: string | null
          vendor_name: string | null
          vendor_profile_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item: string
          notes?: string | null
          org_id: string
          project_id: string
          quantity?: string | null
          scheduled_date?: string | null
          status?: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_profile_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          quantity?: string | null
          scheduled_date?: string | null
          status?: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_deliveries_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliveries_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliveries_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliveries_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliveries_vendor_profile_id"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deliveries_vendor_profile_id"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_annotations: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          note: string
          org_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          note: string
          org_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          note?: string
          org_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_document_annotations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_annotations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_annotations_document_id"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_annotations_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_annotations_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          note: string | null
          original_filename: string | null
          project_id: string
          r2_key: string | null
          storage_path: string | null
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          note?: string | null
          original_filename?: string | null
          project_id: string
          r2_key?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
          version: number
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          note?: string | null
          original_filename?: string | null
          project_id?: string
          r2_key?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_document_versions_document_id"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_versions_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_versions_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_versions_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approval_note: string | null
          approval_status: string | null
          approved_by: string | null
          created_at: string
          extension: string | null
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          is_template: boolean | null
          name: string | null
          org_id: string
          original_filename: string
          phase: string | null
          project_id: string | null
          r2_key: string | null
          shared_with_client: boolean
          size_bytes: number | null
          status: string
          storage_path: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          approval_note?: string | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          extension?: string | null
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          is_template?: boolean | null
          name?: string | null
          org_id: string
          original_filename: string
          phase?: string | null
          project_id?: string | null
          r2_key?: string | null
          shared_with_client?: boolean
          size_bytes?: number | null
          status?: string
          storage_path: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          approval_note?: string | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string
          extension?: string | null
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          is_template?: boolean | null
          name?: string | null
          org_id?: string
          original_filename?: string
          phase?: string | null
          project_id?: string | null
          r2_key?: string | null
          shared_with_client?: boolean
          size_bytes?: number | null
          status?: string
          storage_path?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_documents_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          cgst_amount: number | null
          client_id: string | null
          client_name: string
          client_name_display: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          gst_rate: number | null
          id: string
          igst_amount: number | null
          invoice_number: string
          is_interstate: boolean | null
          issue_date: string | null
          line_items: Json | null
          milestone_label: string | null
          notes: string | null
          org_id: string
          paid_at: string | null
          phase: string | null
          project_id: string | null
          project_name: string | null
          sgst_amount: number | null
          status: string
          subtotal: number | null
          total: number | null
        }
        Insert: {
          amount?: number
          cgst_amount?: number | null
          client_id?: string | null
          client_name: string
          client_name_display?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoice_number: string
          is_interstate?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          milestone_label?: string | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          phase?: string | null
          project_id?: string | null
          project_name?: string | null
          sgst_amount?: number | null
          status?: string
          subtotal?: number | null
          total?: number | null
        }
        Update: {
          amount?: number
          cgst_amount?: number | null
          client_id?: string | null
          client_name?: string
          client_name_display?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          gst_rate?: number | null
          id?: string
          igst_amount?: number | null
          invoice_number?: string
          is_interstate?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          milestone_label?: string | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          phase?: string | null
          project_id?: string | null
          project_name?: string | null
          sgst_amount?: number | null
          status?: string
          subtotal?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_project_id"
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
          severity: string | null
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
          severity?: string | null
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
          severity?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_issues_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_issues_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_logs: {
        Row: {
          contractor: string | null
          created_at: string
          created_by: string | null
          delivered_material: string | null
          id: string
          material_name: string
          notes: string | null
          org_id: string
          project_id: string
          specified_standard: string | null
          status: string
        }
        Insert: {
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          delivered_material?: string | null
          id?: string
          material_name: string
          notes?: string | null
          org_id: string
          project_id: string
          specified_standard?: string | null
          status?: string
        }
        Update: {
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          delivered_material?: string | null
          id?: string
          material_name?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          specified_standard?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_logs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_logs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_logs_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_logs_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          action_items: Json | null
          agenda: string | null
          attendee_emails: string[]
          attendees: string[] | null
          created_at: string | null
          created_by: string | null
          decisions: string[] | null
          ends_at: string | null
          id: string
          invite_sent_at: string | null
          location: string | null
          meeting_date: string | null
          meeting_url: string | null
          notes: string | null
          org_id: string
          project_id: string
          reminder_minutes: number
          reminder_sent_at: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          attendee_emails?: string[]
          attendees?: string[] | null
          created_at?: string | null
          created_by?: string | null
          decisions?: string[] | null
          ends_at?: string | null
          id?: string
          invite_sent_at?: string | null
          location?: string | null
          meeting_date?: string | null
          meeting_url?: string | null
          notes?: string | null
          org_id: string
          project_id: string
          reminder_minutes?: number
          reminder_sent_at?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          attendee_emails?: string[]
          attendees?: string[] | null
          created_at?: string | null
          created_by?: string | null
          decisions?: string[] | null
          ends_at?: string | null
          id?: string
          invite_sent_at?: string | null
          location?: string | null
          meeting_date?: string | null
          meeting_url?: string | null
          notes?: string | null
          org_id?: string
          project_id?: string
          reminder_minutes?: number
          reminder_sent_at?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_meetings_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_meetings_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_meetings_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_meetings_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
            foreignKeyName: "fk_messages_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          href: string | null
          id: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notifications_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string | null
          invited_by: string
          member_role: string | null
          org_id: string
          user_role: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_token?: string | null
          invited_by: string
          member_role?: string | null
          org_id: string
          user_role?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string | null
          invited_by?: string
          member_role?: string | null
          org_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organisation_invites_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_invites_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_invites_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          org_id: string
          profile_id: string
          requested_org_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          org_id: string
          profile_id: string
          requested_org_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          org_id?: string
          profile_id?: string
          requested_org_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organisation_join_requests_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_join_requests_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_join_requests_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_join_requests_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_join_requests_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          created_at: string
          id: string
          member_role: string | null
          org_id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_role?: string | null
          org_id: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_role?: string | null
          org_id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organisation_members_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisation_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          gst_number: string | null
          gst_state_code: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          plan: string
          seats_max: number | null
          state: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          gst_number?: string | null
          gst_state_code?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          plan?: string
          seats_max?: number | null
          state?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          gst_number?: string | null
          gst_state_code?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          plan?: string
          seats_max?: number | null
          state?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organisations_owner_id"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organisations_owner_id"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          approval_name: string
          authority: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          org_id: string
          project_id: string
          status: string
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          approval_name: string
          authority?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          org_id: string
          project_id: string
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_name?: string
          authority?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_permits_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_permits_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_milestones: {
        Row: {
          completion: number | null
          completion_pct: number | null
          created_at: string | null
          fee: number | null
          fee_amount: number | null
          fee_paid: boolean | null
          id: string
          is_template: boolean | null
          label: string | null
          milestone_date: string | null
          notes: string | null
          org_id: string
          paid: boolean | null
          phase: string | null
          phase_key: string
          project_id: string
          rera_certified: boolean | null
          updated_at: string | null
        }
        Insert: {
          completion?: number | null
          completion_pct?: number | null
          created_at?: string | null
          fee?: number | null
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          is_template?: boolean | null
          label?: string | null
          milestone_date?: string | null
          notes?: string | null
          org_id: string
          paid?: boolean | null
          phase?: string | null
          phase_key: string
          project_id: string
          rera_certified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          completion?: number | null
          completion_pct?: number | null
          created_at?: string | null
          fee?: number | null
          fee_amount?: number | null
          fee_paid?: boolean | null
          id?: string
          is_template?: boolean | null
          label?: string | null
          milestone_date?: string | null
          notes?: string | null
          org_id?: string
          paid?: boolean | null
          phase?: string | null
          phase_key?: string
          project_id?: string
          rera_certified?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phase_milestones_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_phase_milestones_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          asker_email: string | null
          asker_name: string | null
          created_at: string
          id: string
          org_id: string
          project_id: string
          question: string
          status: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          asker_email?: string | null
          asker_name?: string | null
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          question: string
          status?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          asker_email?: string | null
          asker_name?: string | null
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          question?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_portal_questions_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_portal_questions_project_id"
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
          discipline: string | null
          email: string | null
          full_name: string | null
          id: string
          notification_preferences: Json
          notify_approvals: boolean | null
          notify_bids: boolean | null
          notify_email: boolean | null
          notify_meetings: boolean | null
          notify_rfi: boolean | null
          onboarded_at: string | null
          org_id: string | null
          phone: string | null
          plan: string
          role: string
          updated_at: string
        }
        Insert: {
          ai_add_on?: boolean
          auth_id: string
          avatar_url?: string | null
          created_at?: string
          discipline?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json
          notify_approvals?: boolean | null
          notify_bids?: boolean | null
          notify_email?: boolean | null
          notify_meetings?: boolean | null
          notify_rfi?: boolean | null
          onboarded_at?: string | null
          org_id?: string | null
          phone?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Update: {
          ai_add_on?: boolean
          auth_id?: string
          avatar_url?: string | null
          created_at?: string
          discipline?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json
          notify_approvals?: boolean | null
          notify_bids?: boolean | null
          notify_email?: boolean | null
          notify_meetings?: boolean | null
          notify_rfi?: boolean | null
          onboarded_at?: string | null
          org_id?: string | null
          phone?: string | null
          plan?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string | null
          id: string
          org_id: string
          project_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string | null
          id?: string
          org_id: string
          project_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          org_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_expenses_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_expenses_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_expenses_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_expenses_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          attendees: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          meeting_at: string
          notes: string | null
          org_id: string
          project_id: string
          status: string
          title: string
        }
        Insert: {
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_at: string
          notes?: string | null
          org_id: string
          project_id: string
          status?: string
          title: string
        }
        Update: {
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_at?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_meetings_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_meetings_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_meetings_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_meetings_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          accepted_at: string | null
          can_approve: boolean | null
          can_comment: boolean | null
          can_upload: boolean | null
          created_at: string
          id: string
          invite_email: string | null
          invite_expires: string | null
          invite_token: string | null
          invited_by: string | null
          profile_id: string | null
          project_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          can_approve?: boolean | null
          can_comment?: boolean | null
          can_upload?: boolean | null
          created_at?: string
          id?: string
          invite_email?: string | null
          invite_expires?: string | null
          invite_token?: string | null
          invited_by?: string | null
          profile_id?: string | null
          project_id: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          can_approve?: boolean | null
          can_comment?: boolean | null
          can_upload?: boolean | null
          created_at?: string
          id?: string
          invite_email?: string | null
          invite_expires?: string | null
          invite_token?: string | null
          invited_by?: string | null
          profile_id?: string | null
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_members_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_members_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_members_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_permits: {
        Row: {
          authority: string | null
          created_at: string
          created_by: string | null
          expires_on: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          project_id: string
          status: string
          submitted_on: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          project_id: string
          status?: string
          submitted_on?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          status?: string
          submitted_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_permits_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_permits_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_permits_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_permits_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          invite_email: string | null
          is_external: boolean
          profile_id: string | null
          project_role: string | null
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          invite_email?: string | null
          is_external?: boolean
          profile_id?: string | null
          project_role?: string | null
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          invite_email?: string | null
          is_external?: boolean
          profile_id?: string | null
          project_role?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_team_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_team_members_profile_id"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_team_members_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "project_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      project_teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          project_id: string
          template_key: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          project_id: string
          template_key?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          project_id?: string
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_teams_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_transmittals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          project_id: string
          recipient: string | null
          sent_at: string | null
          status: string
          subject: string
          transmittal_no: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          project_id: string
          recipient?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          transmittal_no: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          project_id?: string
          recipient?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          transmittal_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_transmittals_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_transmittals_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_transmittals_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_transmittals_project_id"
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
          client_id: string | null
          client_name: string | null
          construction_cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          estimated_end: string | null
          floors: number | null
          id: string
          is_rera_registered: boolean | null
          is_template: boolean | null
          name: string
          org_id: string
          phase: number
          phase_key: string | null
          portal_enabled: boolean
          portal_token: string | null
          rera_number: string | null
          spec_level: string | null
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
          client_id?: string | null
          client_name?: string | null
          construction_cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_end?: string | null
          floors?: number | null
          id?: string
          is_rera_registered?: boolean | null
          is_template?: boolean | null
          name: string
          org_id: string
          phase?: number
          phase_key?: string | null
          portal_enabled?: boolean
          portal_token?: string | null
          rera_number?: string | null
          spec_level?: string | null
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
          client_id?: string | null
          client_name?: string | null
          construction_cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_end?: string | null
          floors?: number | null
          id?: string
          is_rera_registered?: boolean | null
          is_template?: boolean | null
          name?: string
          org_id?: string
          phase?: number
          phase_key?: string | null
          portal_enabled?: boolean
          portal_token?: string | null
          rera_number?: string | null
          spec_level?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          total_sqft?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          defect: string
          id: string
          item_number: number
          location: string | null
          org_id: string
          photo_url: string | null
          project_id: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          defect: string
          id?: string
          item_number?: number
          location?: string | null
          org_id: string
          photo_url?: string | null
          project_id: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          defect?: string
          id?: string
          item_number?: number
          location?: string | null
          org_id?: string
          photo_url?: string | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_punch_items_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_punch_items_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_punch_items_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_punch_items_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          ai_draft_response: string | null
          assigned_to: string | null
          attachment_url: string | null
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
          responded_at: string | null
          responded_by: string | null
          response: string | null
          rfi_number: number
          scope_change_amount: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_draft_response?: string | null
          assigned_to?: string | null
          attachment_url?: string | null
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
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          rfi_number?: number
          scope_change_amount?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_draft_response?: string | null
          assigned_to?: string | null
          attachment_url?: string | null
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
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          rfi_number?: number
          scope_change_amount?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rfis_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfis_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfis_responded_by"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfis_responded_by"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_quotes: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          lead_time_days: number | null
          notes: string | null
          org_id: string
          rfq_id: string
          status: string
          vendor_email: string | null
          vendor_name: string | null
          vendor_profile_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          org_id: string
          rfq_id: string
          status?: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_profile_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          org_id?: string
          rfq_id?: string
          status?: string
          vendor_email?: string | null
          vendor_name?: string | null
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rfq_quotes_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfq_quotes_rfq_id"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfq_quotes_vendor_profile_id"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfq_quotes_vendor_profile_id"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          org_id: string
          project_id: string
          quantity: string | null
          status: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          project_id: string
          quantity?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          project_id?: string
          quantity?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rfqs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfqs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfqs_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rfqs_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          gps_coordinates: string | null
          id: string
          observations: string | null
          org_id: string
          photos: string[] | null
          project_id: string
          supervisor: string | null
          visit_date: string | null
          visit_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          observations?: string | null
          org_id: string
          photos?: string[] | null
          project_id: string
          supervisor?: string | null
          visit_date?: string | null
          visit_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          observations?: string | null
          org_id?: string
          photos?: string[] | null
          project_id?: string
          supervisor?: string | null
          visit_date?: string | null
          visit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_logs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_logs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_logs_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_logs_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          attendees: string | null
          created_at: string
          created_by: string | null
          gps_coordinates: string | null
          id: string
          notes: string | null
          org_id: string
          photo_urls: string[]
          project_id: string
          supervisor: string | null
          visit_date: string | null
          visit_number: number | null
          weather: string | null
        }
        Insert: {
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          notes?: string | null
          org_id: string
          photo_urls?: string[]
          project_id: string
          supervisor?: string | null
          visit_date?: string | null
          visit_number?: number | null
          weather?: string | null
        }
        Update: {
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          photo_urls?: string[]
          project_id?: string
          supervisor?: string | null
          visit_date?: string | null
          visit_number?: number | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_visits_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_visits_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_visits_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_site_visits_project_id"
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
          reviewed_at: string | null
          reviewed_by: string | null
          revision: number | null
          spec_section: string | null
          status: string
          submittal_number: number
          submitted_by: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number | null
          spec_section?: string | null
          status?: string
          submittal_number?: number
          submitted_by?: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number | null
          spec_section?: string | null
          status?: string
          submittal_number?: number
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_submittals_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submittals_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submittals_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submittals_reviewed_by"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submittals_submitted_by"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submittals_submitted_by"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          awarded_bid_id: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string | null
          deadline: string | null
          id: string
          org_id: string
          project_id: string
          project_name: string | null
          scope: string | null
          services: string[] | null
          status: string | null
          timeline_weeks: number | null
          title: string
          trade_type: string | null
          visibility: string | null
        }
        Insert: {
          awarded_bid_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          org_id: string
          project_id: string
          project_name?: string | null
          scope?: string | null
          services?: string[] | null
          status?: string | null
          timeline_weeks?: number | null
          title: string
          trade_type?: string | null
          visibility?: string | null
        }
        Update: {
          awarded_bid_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          org_id?: string
          project_id?: string
          project_name?: string | null
          scope?: string | null
          services?: string[] | null
          status?: string | null
          timeline_weeks?: number | null
          title?: string
          trade_type?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenders_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenders_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transmittals: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          created_by: string | null
          documents: string | null
          id: string
          org_id: string
          project_id: string
          purpose: string | null
          recipient_company: string | null
          recipient_name: string
          sent_date: string | null
          status: string
          transmittal_no: string
          via: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: string | null
          id?: string
          org_id: string
          project_id: string
          purpose?: string | null
          recipient_company?: string | null
          recipient_name: string
          sent_date?: string | null
          status?: string
          transmittal_no: string
          via?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          documents?: string | null
          id?: string
          org_id?: string
          project_id?: string
          purpose?: string | null
          recipient_company?: string | null
          recipient_name?: string
          sent_date?: string | null
          status?: string
          transmittal_no?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transmittals_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transmittals_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transmittals_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transmittals_project_id"
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
          provider?: string
          provider_email?: string | null
          provider_name?: string | null
          refresh_token?: string | null
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_catalog_imports: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string | null
          file_url: string | null
          id: string
          method: string
          org_id: string | null
          owner_email: string
          processed_rows: number
          sample: Json
          source_url: string | null
          status: string
          total_rows: number
          updated_at: string
          vendor_signup_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          method: string
          org_id?: string | null
          owner_email: string
          processed_rows?: number
          sample?: Json
          source_url?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
          vendor_signup_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          method?: string
          org_id?: string | null
          owner_email?: string
          processed_rows?: number
          sample?: Json
          source_url?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
          vendor_signup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendor_catalog_imports_vendor_signup_id"
            columns: ["vendor_signup_id"]
            isOneToOne: false
            referencedRelation: "vendor_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_catalog_items: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          import_id: string | null
          is_active: boolean
          name: string
          org_id: string | null
          owner_email: string
          price: number | null
          sku: string
          unit: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          import_id?: string | null
          is_active?: boolean
          name: string
          org_id?: string | null
          owner_email: string
          price?: number | null
          sku: string
          unit?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          import_id?: string | null
          is_active?: boolean
          name?: string
          org_id?: string | null
          owner_email?: string
          price?: number | null
          sku?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendor_catalog_items_import_id"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "vendor_catalog_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_recommendations: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          note: string | null
          project_id: string
          recommended_by: string | null
          specialization: string | null
          status: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          note?: string | null
          project_id: string
          recommended_by?: string | null
          specialization?: string | null
          status?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          note?: string | null
          project_id?: string
          recommended_by?: string | null
          specialization?: string | null
          status?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendor_recommendations_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vendor_recommendations_recommended_by"
            columns: ["recommended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vendor_recommendations_recommended_by"
            columns: ["recommended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_signups: {
        Row: {
          bio: string | null
          business_name: string
          catalog_file_url: string | null
          catalog_item_count: number | null
          catalog_method: string | null
          catalog_notes: string | null
          categories: string[]
          city: string
          contact_name: string
          country: string | null
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
          catalog_file_url?: string | null
          catalog_item_count?: number | null
          catalog_method?: string | null
          catalog_notes?: string | null
          categories?: string[]
          city: string
          contact_name: string
          country?: string | null
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
          catalog_file_url?: string | null
          catalog_item_count?: number | null
          catalog_method?: string | null
          catalog_notes?: string | null
          categories?: string[]
          city?: string
          contact_name?: string
          country?: string | null
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
      waitlist: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string
          firm: string | null
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          firm?: string | null
          id?: string
          name?: string | null
          role?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
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
          direction: string | null
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
          direction?: string | null
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
          direction?: string | null
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
      users: {
        Row: {
          ai_add_on: boolean | null
          auth_id: string | null
          avatar_url: string | null
          created_at: string | null
          discipline: string | null
          email: string | null
          full_name: string | null
          id: string | null
          notify_approvals: boolean | null
          notify_bids: boolean | null
          notify_email: boolean | null
          notify_meetings: boolean | null
          notify_rfi: boolean | null
          onboarded_at: string | null
          org_id: string | null
          phone: string | null
          plan: string | null
          role: string | null
        }
        Insert: {
          ai_add_on?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          discipline?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          notify_approvals?: boolean | null
          notify_bids?: boolean | null
          notify_email?: boolean | null
          notify_meetings?: boolean | null
          notify_rfi?: boolean | null
          onboarded_at?: string | null
          org_id?: string | null
          phone?: string | null
          plan?: string | null
          role?: string | null
        }
        Update: {
          ai_add_on?: boolean | null
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          discipline?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          notify_approvals?: boolean | null
          notify_bids?: boolean | null
          notify_email?: boolean | null
          notify_meetings?: boolean | null
          notify_rfi?: boolean | null
          onboarded_at?: string | null
          org_id?: string | null
          phone?: string | null
          plan?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_project: { Args: { proj: string }; Returns: boolean }
      current_user_id: { Args: never; Returns: string }
      current_user_org_id: { Args: never; Returns: string }
      get_or_create_project_channel: {
        Args: { p_channel: string; p_project_id: string }
        Returns: string
      }
      is_conversation_member: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_org_admin: { Args: { org: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      list_project_channel_messages: {
        Args: { p_channel?: string; p_limit?: number; p_project_id: string }
        Returns: Json
      }
      my_org_id: { Args: never; Returns: string }
      my_profile_id: { Args: never; Returns: string }
      post_project_channel_message: {
        Args: { p_body: string; p_channel: string; p_project_id: string }
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
