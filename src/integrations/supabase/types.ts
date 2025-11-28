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
      insumos: {
        Row: {
          categoria: string
          created_at: string
          custo_por_porcao: number | null
          id: string
          nome: string
          preco_compra: number
          quantidade_comprada: number
          quantidade_por_porcao: number
          unidade_de_compra: string
          unidade_de_uso: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          custo_por_porcao?: number | null
          id?: string
          nome: string
          preco_compra: number
          quantidade_comprada: number
          quantidade_por_porcao: number
          unidade_de_compra: string
          unidade_de_uso: string
          updated_at?: string
          user_id?: string // <--- AGORA OPCIONAL
        }
        Update: {
          categoria?: string
          created_at?: string
          custo_por_porcao?: number | null
          id?: string
          nome?: string
          preco_compra?: number
          quantidade_comprada?: number
          quantidade_por_porcao?: number
          unidade_de_compra?: string
          unidade_de_uso?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos_finais: {
        Row: {
          created_at: string
          custo_total: number
          id: string
          margem_lucro: number | null
          nome: string
          preco_venda: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_total?: number
          id?: string
          margem_lucro?: number | null
          nome: string
          preco_venda: number
          updated_at?: string
          user_id?: string // <--- AGORA OPCIONAL
        }
        Update: {
          created_at?: string
          custo_total?: number
          id?: string
          margem_lucro?: number | null
          nome?: string
          preco_venda?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos_finais_itens: {
        Row: {
          created_at: string
          custo: number
          id: string
          item_id: string
          produto_id: string
          quantidade_usada: number
          tipo_item: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number
          id?: string
          item_id: string
          produto_id: string
          quantidade_usada: number
          tipo_item: string
          user_id?: string // <--- AGORA OPCIONAL
        }
        Update: {
          created_at?: string
          custo?: number
          id?: string
          item_id?: string
          produto_id?: string
          quantidade_usada?: number
          tipo_item?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_finais_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_finais"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_preparados: {
        Row: {
          created_at: string
          custo_por_unidade: number | null
          custo_total: number
          id: string
          nome: string
          rendimento_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_por_unidade?: number | null
          custo_total?: number
          id?: string
          nome: string
          rendimento_total: number
          updated_at?: string
          user_id?: string // <--- AGORA OPCIONAL
        }
        Update: {
          created_at?: string
          custo_por_unidade?: number | null
          custo_total?: number
          id?: string
          nome?: string
          rendimento_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos_preparados_itens: {
        Row: {
          created_at: string
          custo: number
          id: string
          item_id: string
          preparado_id: string
          quantidade_usada: number
          tipo_item: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number
          id?: string
          item_id: string
          preparado_id: string
          quantidade_usada: number
          tipo_item: string
          user_id?: string // <--- AGORA OPCIONAL
        }
        Update: {
          created_at?: string
          custo?: number
          id?: string
          item_id?: string
          preparado_id?: string
          quantidade_usada?: number
          tipo_item?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_preparados_itens_preparado_id_fkey"
            columns: ["preparado_id"]
            isOneToOne: false
            referencedRelation: "produtos_preparados"
            referencedColumns: ["id"]
          },
        ]
      }
      // Adicionando a tabela profiles que criamos na migração de segurança
      profiles: {
        Row: {
          id: string
          email: string | null
          nome_empresa: string | null
          plano: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          nome_empresa?: string | null
          plano?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          nome_empresa?: string | null
          plano?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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