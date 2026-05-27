export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          owner_user_id: string
          company_name: string | null
          city: string | null
          segment: string | null
          market_time: string | null
          sales_model: string | null
          main_goal: string | null
          main_difficulty: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          owner_user_id: string
          company_name?: string | null
          city?: string | null
          segment?: string | null
          market_time?: string | null
          sales_model?: string | null
          main_goal?: string | null
          main_difficulty?: string | null
          status?: string | null
        }
        Update: {
          owner_user_id?: string
          company_name?: string | null
          city?: string | null
          segment?: string | null
          market_time?: string | null
          sales_model?: string | null
          main_goal?: string | null
          main_difficulty?: string | null
          status?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          id: string
          company_id: string
          user_id: string
          tipo: string
          descricao: string
          valor: number
          categoria: string | null
          contact_id: string | null
          product_id: string | null
          data_lancamento: string
          created_at: string
        }
        Insert: {
          company_id: string
          user_id: string
          tipo: string
          descricao: string
          valor: number
          categoria?: string | null
          contact_id?: string | null
          product_id?: string | null
          data_lancamento: string
        }
        Update: {
          company_id?: string
          user_id?: string
          tipo?: string
          descricao?: string
          valor?: number
          categoria?: string | null
          contact_id?: string | null
          product_id?: string | null
          data_lancamento?: string
        }
        Relationships: []
      }
      company_intelligence: {
        Row: {
          company_id: string
          ai_context: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          ai_context: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          ai_context?: Json
          updated_at?: string
        }
        Relationships: []
      }
      company_diagnostics: {
        Row: {
          id: string
          company_id: string
          raw_input: Json | null
          ai_output: Json | null
          score: number | null
          created_at: string
        }
        Insert: {
          company_id: string
          raw_input?: Json | null
          ai_output?: Json | null
          score?: number | null
        }
        Update: {
          company_id?: string
          raw_input?: Json | null
          ai_output?: Json | null
          score?: number | null
        }
        Relationships: []
      }
      company_sales_profile: {
        Row: {
          id: string
          company_id: string
          answers: Json | null
          profile: Json | null
          created_at: string
        }
        Insert: {
          company_id: string
          answers?: Json | null
          profile?: Json | null
        }
        Update: {
          company_id?: string
          answers?: Json | null
          profile?: Json | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          company_id: string
          nome: string
          contato: string | null
          tipo: string
          created_at: string
        }
        Insert: {
          company_id: string
          nome: string
          contato?: string | null
          tipo: string
        }
        Update: {
          company_id?: string
          nome?: string
          contato?: string | null
          tipo?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          company_id: string
          nome: string
          preco: number
          cat: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          nome: string
          preco: number
          cat?: string | null
        }
        Update: {
          company_id?: string
          nome?: string
          preco?: number
          cat?: string | null
        }
        Relationships: []
      }
      company_evo_history: {
        Row: {
          id: string
          company_id: string
          month: number
          year: number
          score: number
          label: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          month: number
          year: number
          score: number
          label?: string | null
        }
        Update: {
          company_id?: string
          month?: number
          year?: number
          score?: number
          label?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
