export type Insumo = {
  id: string;
  user_id: string;
  nome: string;
  categoria: string;
  unidade_de_compra: string;
  quantidade_comprada: number;
  preco_compra: number;
  unidade_de_uso: string;
  quantidade_por_porcao: number;
  custo_por_porcao?: number;
  created_at: string;
  updated_at: string;
};

export type ProdutoPreparado = {
  id: string;
  user_id: string;
  nome: string;
  rendimento_total: number;
  custo_total: number;
  custo_por_unidade?: number;
  created_at: string;
  updated_at: string;
};

export type ProdutoPreparadoItem = {
  id: string;
  user_id: string;
  preparado_id: string;
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  quantidade_usada: number;
  custo: number;
  created_at: string;
};

export type ProdutoFinal = {
  id: string;
  user_id: string;
  nome: string;
  preco_venda: number;
  custo_total: number;
  margem_lucro?: number;
  created_at: string;
  updated_at: string;
};

export type ProdutoFinalItem = {
  id: string;
  user_id: string;
  produto_id: string;
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  quantidade_usada: number;
  custo: number;
  created_at: string;
};
