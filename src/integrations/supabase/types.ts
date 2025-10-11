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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_aparencia: {
        Row: {
          cor_principal: string
          created_at: string
          id: string
          tema: string
          updated_at: string
        }
        Insert: {
          cor_principal?: string
          created_at?: string
          id?: string
          tema?: string
          updated_at?: string
        }
        Update: {
          cor_principal?: string
          created_at?: string
          id?: string
          tema?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_empresa: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_financeiras: {
        Row: {
          alertas_inadimplencia: boolean | null
          alertas_orcamento: boolean | null
          alertas_vencimento: boolean | null
          ciclo_cobranca_padrao: string
          created_at: string
          dias_alerta_vencimento: number | null
          id: string
          moeda: string
          taxa_impostos: number | null
          updated_at: string
        }
        Insert: {
          alertas_inadimplencia?: boolean | null
          alertas_orcamento?: boolean | null
          alertas_vencimento?: boolean | null
          ciclo_cobranca_padrao?: string
          created_at?: string
          dias_alerta_vencimento?: number | null
          id?: string
          moeda?: string
          taxa_impostos?: number | null
          updated_at?: string
        }
        Update: {
          alertas_inadimplencia?: boolean | null
          alertas_orcamento?: boolean | null
          alertas_vencimento?: boolean | null
          ciclo_cobranca_padrao?: string
          created_at?: string
          dias_alerta_vencimento?: number | null
          id?: string
          moeda?: string
          taxa_impostos?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_integracoes: {
        Row: {
          ativo: boolean | null
          configuracoes: Json | null
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_seguranca: {
        Row: {
          autenticacao_dois_fatores: boolean | null
          created_at: string
          exigir_caracteres_especiais: boolean | null
          id: string
          log_atividades: boolean | null
          politica_senha_minima: number | null
          timeout_sessao: number | null
          updated_at: string
        }
        Insert: {
          autenticacao_dois_fatores?: boolean | null
          created_at?: string
          exigir_caracteres_especiais?: boolean | null
          id?: string
          log_atividades?: boolean | null
          politica_senha_minima?: number | null
          timeout_sessao?: number | null
          updated_at?: string
        }
        Update: {
          autenticacao_dois_fatores?: boolean | null
          created_at?: string
          exigir_caracteres_especiais?: boolean | null
          id?: string
          log_atividades?: boolean | null
          politica_senha_minima?: number | null
          timeout_sessao?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gp_activity_logs: {
        Row: {
          action: string
          actor_id: string
          company_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          payload: Json | null
          project_id: string
        }
        Insert: {
          action: string
          actor_id: string
          company_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          payload?: Json | null
          project_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          company_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          payload?: Json | null
          project_id?: string
        }
        Relationships: []
      }
      gp_checklist_items: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          project_id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_clients: {
        Row: {
          address: string | null
          company: string | null
          company_id: string | null
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          observations: string | null
          phone: string | null
          segment: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          company_id?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          name: string
          observations?: string | null
          phone?: string | null
          segment?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          company_id?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          observations?: string | null
          phone?: string | null
          segment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gp_comments: {
        Row: {
          author_id: string
          body: string
          company_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          company_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          company_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gp_documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_client_visible: boolean | null
          project_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_client_visible?: boolean | null
          project_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_client_visible?: boolean | null
          project_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "gp_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gp_labels: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gp_meetings: {
        Row: {
          agenda: Json | null
          attendees: Json | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_date: string
          meeting_link: string | null
          meeting_type: string | null
          notes: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: Json | null
          attendees?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_date: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: Json | null
          attendees?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_date?: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_project_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_type: string | null
          id: string
          mime_type: string | null
          name: string
          project_id: string
          size_bytes: number | null
          stage_related: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_type?: string | null
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          size_bytes?: number | null
          stage_related?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_type?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          size_bytes?: number | null
          stage_related?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_project_expectations: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_done: boolean
          position: number
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean
          position?: number
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_project_expectations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_expectations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_project_labels: {
        Row: {
          created_at: string
          id: string
          label_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_project_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "gp_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_labels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_labels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_project_risks: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          impact: string
          mitigation: string | null
          owner_id: string | null
          probability: string
          project_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          impact: string
          mitigation?: string | null
          owner_id?: string | null
          probability: string
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          impact?: string
          mitigation?: string | null
          owner_id?: string | null
          probability?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_project_stages: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_current: boolean
          name: string
          order_index: number
          project_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          name: string
          order_index: number
          project_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_current?: boolean
          name?: string
          order_index?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_projects: {
        Row: {
          assigned_to: string | null
          budget: number | null
          client_id: string
          company_id: string | null
          complexity: number | null
          created_at: string
          current_stage_id: string | null
          deadline: string | null
          description: string | null
          id: string
          manager_id: string | null
          priority: string
          progress: number | null
          sprint_length_days: number | null
          stakeholders: string[] | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          client_id: string
          company_id?: string | null
          complexity?: number | null
          created_at?: string
          current_stage_id?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          priority?: string
          progress?: number | null
          sprint_length_days?: number | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          client_id?: string
          company_id?: string | null
          complexity?: number | null
          created_at?: string
          current_stage_id?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          priority?: string
          progress?: number | null
          sprint_length_days?: number | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "gp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gp_resource_allocations: {
        Row: {
          active: boolean
          company_id: string
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          updated_at: string | null
          user_id: string
          weekly_capacity_hours: number
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          updated_at?: string | null
          user_id: string
          weekly_capacity_hours?: number
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_capacity_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "gp_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_sprints: {
        Row: {
          closed: boolean
          company_id: string
          created_at: string | null
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string
          updated_at: string | null
          velocity_target: number | null
        }
        Insert: {
          closed?: boolean
          company_id: string
          created_at?: string | null
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date: string
          updated_at?: string | null
          velocity_target?: number | null
        }
        Update: {
          closed?: boolean
          company_id?: string
          created_at?: string | null
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string
          updated_at?: string | null
          velocity_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gp_task_checklist: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_done: boolean
          position: number
          task_id: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_task_checklist_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "gp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_task_checklist_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_gantt"
            referencedColumns: ["task_id"]
          },
        ]
      }
      gp_task_comments: {
        Row: {
          author_id: string
          company_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          company_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "gp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_gantt"
            referencedColumns: ["task_id"]
          },
        ]
      }
      gp_task_labels: {
        Row: {
          created_at: string
          id: string
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_task_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "gp_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_task_labels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "gp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_task_labels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_gantt"
            referencedColumns: ["task_id"]
          },
        ]
      }
      gp_task_subtasks: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_done: boolean
          position: number
          task_id: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_done?: boolean
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "gp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_task_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_gantt"
            referencedColumns: ["task_id"]
          },
        ]
      }
      gp_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          block_reason: string | null
          blocked: boolean
          company_id: string | null
          created_at: string
          dependency_task_id: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          logged_hours: number | null
          priority: string
          progress: number
          project_id: string
          sprint_id: string | null
          stage_id: string | null
          start_date: string | null
          status: string
          story_points: number | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          block_reason?: string | null
          blocked?: boolean
          company_id?: string | null
          created_at?: string
          dependency_task_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          logged_hours?: number | null
          priority?: string
          progress?: number
          project_id: string
          sprint_id?: string | null
          stage_id?: string | null
          start_date?: string | null
          status?: string
          story_points?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          block_reason?: string | null
          blocked?: boolean
          company_id?: string | null
          created_at?: string
          dependency_task_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          logged_hours?: number | null
          priority?: string
          progress?: number
          project_id?: string
          sprint_id?: string | null
          stage_id?: string | null
          start_date?: string | null
          status?: string
          story_points?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gp_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_dependency_task_id_fkey"
            columns: ["dependency_task_id"]
            isOneToOne: false
            referencedRelation: "gp_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_dependency_task_id_fkey"
            columns: ["dependency_task_id"]
            isOneToOne: false
            referencedRelation: "v_project_gantt"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "gp_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "gp_sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "gp_project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_retiradas: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          retirada_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          retirada_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          retirada_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_retiradas_retirada_id_fkey"
            columns: ["retirada_id"]
            isOneToOne: false
            referencedRelation: "retiradas_socios"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabela: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nm_cargos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nivel: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nivel: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nivel?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_categorias_despesas: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_categorias_receitas: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato: string
          created_at: string
          data_cadastro: string
          email: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          segmento: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato: string
          created_at?: string
          data_cadastro?: string
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          segmento?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string
          created_at?: string
          data_cadastro?: string
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          segmento?: string | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_contratos: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_assinatura: string | null
          dia_vencimento: number
          id: string
          status: string
          tipo_cobranca: string
          tipo_servico: string
          updated_at: string
          valor_mensal: number
          valor_unico: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_assinatura?: string | null
          dia_vencimento?: number
          id?: string
          status?: string
          tipo_cobranca?: string
          tipo_servico: string
          updated_at?: string
          valor_mensal?: number
          valor_unico?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_assinatura?: string | null
          dia_vencimento?: number
          id?: string
          status?: string
          tipo_cobranca?: string
          tipo_servico?: string
          updated_at?: string
          valor_mensal?: number
          valor_unico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nm_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "nm_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_despesas: {
        Row: {
          ano: number
          categoria_id: string
          created_at: string
          data_fim_recorrencia: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          despesa_pai_id: string | null
          forma_pagamento: string | null
          id: string
          mes: number
          observacoes: string | null
          recorrente: boolean
          status: string
          tipo_recorrencia: string | null
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ano: number
          categoria_id: string
          created_at?: string
          data_fim_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          despesa_pai_id?: string | null
          forma_pagamento?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          tipo_recorrencia?: string | null
          titulo: string
          updated_at?: string
          valor: number
        }
        Update: {
          ano?: number
          categoria_id?: string
          created_at?: string
          data_fim_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          despesa_pai_id?: string | null
          forma_pagamento?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          tipo_recorrencia?: string | null
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "nm_despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "nm_categorias_despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_despesas_despesa_pai_id_fkey"
            columns: ["despesa_pai_id"]
            isOneToOne: false
            referencedRelation: "nm_despesas"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_faturas: {
        Row: {
          contrato_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "nm_faturas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "nm_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_funcionarios: {
        Row: {
          agencia: string | null
          avatar_url: string | null
          banco: string | null
          cargo_id: string | null
          conta: string | null
          created_at: string
          data_inicio: string
          data_nascimento: string | null
          documento: string
          email: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          pix: string | null
          salario_base: number
          setor_id: string | null
          status: string
          telefone: string | null
          tipo_contratacao: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          avatar_url?: string | null
          banco?: string | null
          cargo_id?: string | null
          conta?: string | null
          created_at?: string
          data_inicio: string
          data_nascimento?: string | null
          documento: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          pix?: string | null
          salario_base?: number
          setor_id?: string | null
          status?: string
          telefone?: string | null
          tipo_contratacao: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          avatar_url?: string | null
          banco?: string | null
          cargo_id?: string | null
          conta?: string | null
          created_at?: string
          data_inicio?: string
          data_nascimento?: string | null
          documento?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          pix?: string | null
          salario_base?: number
          setor_id?: string | null
          status?: string
          telefone?: string | null
          tipo_contratacao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nm_funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "nm_cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_funcionarios_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "nm_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_historico_contratos: {
        Row: {
          campo_alterado: string
          contrato_id: string
          data_alteracao: string
          id: string
          observacoes: string | null
          usuario: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          contrato_id: string
          data_alteracao?: string
          id?: string
          observacoes?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          contrato_id?: string
          data_alteracao?: string
          id?: string
          observacoes?: string | null
          usuario?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nm_historico_contratos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "nm_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_leads: {
        Row: {
          created_at: string
          data_criacao: string
          data_reuniao: string | null
          data_ultima_interacao: string | null
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem_id: string
          responsavel_id: string | null
          status_pipeline: string
          telefone: string | null
          tipo_servico_id: string | null
          updated_at: string
          valor_oportunidade: number
        }
        Insert: {
          created_at?: string
          data_criacao?: string
          data_reuniao?: string | null
          data_ultima_interacao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem_id: string
          responsavel_id?: string | null
          status_pipeline: string
          telefone?: string | null
          tipo_servico_id?: string | null
          updated_at?: string
          valor_oportunidade?: number
        }
        Update: {
          created_at?: string
          data_criacao?: string
          data_reuniao?: string | null
          data_ultima_interacao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem_id?: string
          responsavel_id?: string | null
          status_pipeline?: string
          telefone?: string | null
          tipo_servico_id?: string | null
          updated_at?: string
          valor_oportunidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "nm_leads_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "nm_origens_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_leads_status_pipeline_fkey"
            columns: ["status_pipeline"]
            isOneToOne: false
            referencedRelation: "nm_pipeline_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_leads_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "nm_tipos_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_leads_historico: {
        Row: {
          created_at: string
          data_mudanca: string
          etapa_anterior: string | null
          etapa_nova: string
          id: string
          lead_id: string
          observacoes: string | null
        }
        Insert: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: string | null
          etapa_nova: string
          id?: string
          lead_id: string
          observacoes?: string | null
        }
        Update: {
          created_at?: string
          data_mudanca?: string
          etapa_anterior?: string | null
          etapa_nova?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nm_leads_historico_etapa_anterior_fkey"
            columns: ["etapa_anterior"]
            isOneToOne: false
            referencedRelation: "nm_pipeline_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_leads_historico_etapa_nova_fkey"
            columns: ["etapa_nova"]
            isOneToOne: false
            referencedRelation: "nm_pipeline_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_leads_historico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "nm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_origens_leads: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_pipeline_etapas: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome: string
          ordem: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      nm_projecoes_metricas: {
        Row: {
          break_even_mes: number | null
          clientes_finais: number | null
          created_at: string
          crescimento_percentual: number | null
          id: string
          melhor_caso_receita: number | null
          mrr_final: number | null
          payback_medio_meses: number | null
          pior_caso_receita: number | null
          receita_total_periodo: number | null
          roi_medio_percentual: number | null
          simulacao_id: string
          updated_at: string
        }
        Insert: {
          break_even_mes?: number | null
          clientes_finais?: number | null
          created_at?: string
          crescimento_percentual?: number | null
          id?: string
          melhor_caso_receita?: number | null
          mrr_final?: number | null
          payback_medio_meses?: number | null
          pior_caso_receita?: number | null
          receita_total_periodo?: number | null
          roi_medio_percentual?: number | null
          simulacao_id: string
          updated_at?: string
        }
        Update: {
          break_even_mes?: number | null
          clientes_finais?: number | null
          created_at?: string
          crescimento_percentual?: number | null
          id?: string
          melhor_caso_receita?: number | null
          mrr_final?: number | null
          payback_medio_meses?: number | null
          pior_caso_receita?: number | null
          receita_total_periodo?: number | null
          roi_medio_percentual?: number | null
          simulacao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nm_projecoes_metricas_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "nm_projecoes_simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_projecoes_resultados: {
        Row: {
          ano: number
          cac_investido: number
          clientes_perdidos: number
          clientes_total: number
          created_at: string
          id: string
          ltv_medio: number
          mes: number
          mes_numero: number
          mrr: number
          novos_clientes: number
          receita_acumulada: number
          receita_mes: number
          simulacao_id: string
        }
        Insert: {
          ano: number
          cac_investido: number
          clientes_perdidos: number
          clientes_total: number
          created_at?: string
          id?: string
          ltv_medio: number
          mes: number
          mes_numero: number
          mrr: number
          novos_clientes: number
          receita_acumulada: number
          receita_mes: number
          simulacao_id: string
        }
        Update: {
          ano?: number
          cac_investido?: number
          clientes_perdidos?: number
          clientes_total?: number
          created_at?: string
          id?: string
          ltv_medio?: number
          mes?: number
          mes_numero?: number
          mrr?: number
          novos_clientes?: number
          receita_acumulada?: number
          receita_mes?: number
          simulacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nm_projecoes_resultados_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "nm_projecoes_simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_projecoes_simulacoes: {
        Row: {
          cac: number | null
          churn_rate: number
          clientes_atuais: number | null
          created_at: string
          descricao: string | null
          id: string
          margem_liquida: number | null
          mrr_atual: number | null
          nome: string
          novos_clientes_mes: number
          periodo_meses: number
          ticket_medio: number
          tipo_cenario: string | null
          updated_at: string
        }
        Insert: {
          cac?: number | null
          churn_rate?: number
          clientes_atuais?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          margem_liquida?: number | null
          mrr_atual?: number | null
          nome: string
          novos_clientes_mes?: number
          periodo_meses?: number
          ticket_medio?: number
          tipo_cenario?: string | null
          updated_at?: string
        }
        Update: {
          cac?: number | null
          churn_rate?: number
          clientes_atuais?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          margem_liquida?: number | null
          mrr_atual?: number | null
          nome?: string
          novos_clientes_mes?: number
          periodo_meses?: number
          ticket_medio?: number
          tipo_cenario?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nm_receitas: {
        Row: {
          ano: number
          categoria_id: string
          cliente_id: string | null
          contrato_id: string | null
          created_at: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          mes: number
          observacoes: string | null
          status: string
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ano: number
          categoria_id: string
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          status?: string
          titulo: string
          updated_at?: string
          valor: number
        }
        Update: {
          ano?: number
          categoria_id?: string
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "nm_receitas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "nm_categorias_receitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_receitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "nm_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nm_receitas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "nm_contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_setores: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      nm_tipos_servicos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permissoes: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          id: string
          modulo: string
          nome: string
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          id?: string
          modulo: string
          nome: string
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          modulo?: string
          nome?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_login: string | null
          nome: string
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          last_login?: string | null
          nome: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_login?: string | null
          nome?: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      retiradas_socios: {
        Row: {
          categoria_id: string | null
          comprovante_url: string | null
          created_at: string | null
          created_by: string | null
          data_pagamento: string | null
          data_retirada: string
          descricao: string | null
          forma_pagamento: string | null
          id: string
          mes_referencia: string
          observacoes: string | null
          socio_id: string
          status: string | null
          tipo_retirada: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento?: string | null
          data_retirada: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia: string
          observacoes?: string | null
          socio_id: string
          status?: string | null
          tipo_retirada: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento?: string | null
          data_retirada?: string
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          mes_referencia?: string
          observacoes?: string | null
          socio_id?: string
          status?: string | null
          tipo_retirada?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "retiradas_socios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "nm_categorias_despesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retiradas_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissoes: {
        Row: {
          created_at: string
          id: string
          permissao_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permissao_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permissao_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_metrics: {
        Row: {
          ano: number
          cac: number | null
          created_at: string
          faturamento: number | null
          follow_up: number | null
          id: string
          indicacoes: number | null
          leads_alto_potencial: number | null
          leads_gerados: number | null
          mes: number
          mrr: number | null
          propostas_na_mesa: number | null
          reagendamentos: number | null
          reunioes_agendadas: number | null
          reunioes_realizadas: number | null
          updated_at: string
          valor_investido_trafego: number | null
        }
        Insert: {
          ano: number
          cac?: number | null
          created_at?: string
          faturamento?: number | null
          follow_up?: number | null
          id?: string
          indicacoes?: number | null
          leads_alto_potencial?: number | null
          leads_gerados?: number | null
          mes: number
          mrr?: number | null
          propostas_na_mesa?: number | null
          reagendamentos?: number | null
          reunioes_agendadas?: number | null
          reunioes_realizadas?: number | null
          updated_at?: string
          valor_investido_trafego?: number | null
        }
        Update: {
          ano?: number
          cac?: number | null
          created_at?: string
          faturamento?: number | null
          follow_up?: number | null
          id?: string
          indicacoes?: number | null
          leads_alto_potencial?: number | null
          leads_gerados?: number | null
          mes?: number
          mrr?: number | null
          propostas_na_mesa?: number | null
          reagendamentos?: number | null
          reunioes_agendadas?: number | null
          reunioes_realizadas?: number | null
          updated_at?: string
          valor_investido_trafego?: number | null
        }
        Relationships: []
      }
      sales_targets: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          meta_cac: number | null
          meta_faturamento: number | null
          meta_follow_up: number | null
          meta_indicacoes: number | null
          meta_leads_alto_potencial: number | null
          meta_leads_gerados: number | null
          meta_mrr: number | null
          meta_propostas_na_mesa: number | null
          meta_reagendamentos: number | null
          meta_reunioes_agendadas: number | null
          meta_reunioes_realizadas: number | null
          meta_valor_investido_trafego: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          meta_cac?: number | null
          meta_faturamento?: number | null
          meta_follow_up?: number | null
          meta_indicacoes?: number | null
          meta_leads_alto_potencial?: number | null
          meta_leads_gerados?: number | null
          meta_mrr?: number | null
          meta_propostas_na_mesa?: number | null
          meta_reagendamentos?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          meta_valor_investido_trafego?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          meta_cac?: number | null
          meta_faturamento?: number | null
          meta_follow_up?: number | null
          meta_indicacoes?: number | null
          meta_leads_alto_potencial?: number | null
          meta_leads_gerados?: number | null
          meta_mrr?: number | null
          meta_propostas_na_mesa?: number | null
          meta_reagendamentos?: number | null
          meta_reunioes_agendadas?: number | null
          meta_reunioes_realizadas?: number | null
          meta_valor_investido_trafego?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      socios: {
        Row: {
          avatar_url: string | null
          cpf: string
          created_at: string | null
          dados_bancarios: Json | null
          data_entrada: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          percentual_participacao: number
          status: string | null
          telefone: string | null
          tipo_socio: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf: string
          created_at?: string | null
          dados_bancarios?: Json | null
          data_entrada: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          percentual_participacao: number
          status?: string | null
          telefone?: string | null
          tipo_socio: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string
          created_at?: string | null
          dados_bancarios?: Json | null
          data_entrada?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_participacao?: number
          status?: string | null
          telefone?: string | null
          tipo_socio?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_project_gantt: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          duration_days: number | null
          is_overdue: boolean | null
          priority: string | null
          progress: number | null
          project_id: string | null
          stage_id: string | null
          stage_name: string | null
          stage_order: number | null
          start_date: string | null
          status: string | null
          task_id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "gp_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "gp_project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_stats: {
        Row: {
          avg_lead_time_days: number | null
          budget: number | null
          completed_tasks: number | null
          completion_percentage: number | null
          current_stage_id: string | null
          deadline: string | null
          in_progress_tasks: number | null
          overdue_tasks: number | null
          pending_tasks: number | null
          project_id: string | null
          project_progress: number | null
          project_status: string | null
          review_tasks: number | null
          title: string | null
          total_tasks: number | null
        }
        Relationships: []
      }
      v_project_task_stats: {
        Row: {
          completed: number | null
          in_progress: number | null
          pending: number | null
          progress_score: number | null
          project_id: string | null
          review: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gp_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gp_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_stats"
            referencedColumns: ["project_id"]
          },
        ]
      }
    }
    Functions: {
      calcular_projecoes: {
        Args: {
          p_cac: number
          p_churn_rate: number
          p_clientes_atuais: number
          p_mrr_atual: number
          p_novos_clientes_mes: number
          p_periodo_meses: number
          p_simulacao_id: string
          p_ticket_medio: number
        }
        Returns: undefined
      }
      gerar_despesas_folha_pagamento: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      gerar_despesas_recorrentes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_by_email: {
        Args: { user_email: string }
        Returns: {
          ativo: boolean
          email: string
          id: string
          nome: string
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }[]
      }
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_financeiro: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      setup_admin_user: {
        Args: { user_email: string; user_name: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: { _acao: string; _modulo: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "financeiro" | "operacional" | "vendas"
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
      user_role: ["admin", "financeiro", "operacional", "vendas"],
    },
  },
} as const
