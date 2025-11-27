-- Criação das tabelas do sistema de precificação
-- Todas com RLS ativado e políticas multi-tenant

-- 1. Tabela de insumos
CREATE TABLE public.insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade_de_compra TEXT NOT NULL,
  quantidade_comprada NUMERIC NOT NULL CHECK (quantidade_comprada > 0),
  preco_compra NUMERIC NOT NULL CHECK (preco_compra >= 0),
  unidade_de_uso TEXT NOT NULL,
  quantidade_por_porcao NUMERIC NOT NULL CHECK (quantidade_por_porcao > 0),
  custo_por_porcao NUMERIC GENERATED ALWAYS AS (
    (preco_compra / quantidade_comprada) * quantidade_por_porcao
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de produtos preparados
CREATE TABLE public.produtos_preparados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  rendimento_total NUMERIC NOT NULL CHECK (rendimento_total > 0),
  custo_total NUMERIC NOT NULL DEFAULT 0,
  custo_por_unidade NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN rendimento_total > 0 THEN custo_total / rendimento_total 
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de itens dos produtos preparados
CREATE TABLE public.produtos_preparados_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preparado_id UUID NOT NULL REFERENCES public.produtos_preparados(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('insumo', 'preparado')),
  quantidade_usada NUMERIC NOT NULL CHECK (quantidade_usada > 0),
  custo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de produtos finais
CREATE TABLE public.produtos_finais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco_venda NUMERIC NOT NULL CHECK (preco_venda >= 0),
  custo_total NUMERIC NOT NULL DEFAULT 0,
  margem_lucro NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN custo_total > 0 THEN ((preco_venda - custo_total) / custo_total * 100)
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de itens dos produtos finais
CREATE TABLE public.produtos_finais_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos_finais(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  tipo_item TEXT NOT NULL CHECK (tipo_item IN ('insumo', 'preparado')),
  quantidade_usada NUMERIC NOT NULL CHECK (quantidade_usada > 0),
  custo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_insumos_user_id ON public.insumos(user_id);
CREATE INDEX idx_produtos_preparados_user_id ON public.produtos_preparados(user_id);
CREATE INDEX idx_produtos_preparados_itens_user_id ON public.produtos_preparados_itens(user_id);
CREATE INDEX idx_produtos_preparados_itens_preparado_id ON public.produtos_preparados_itens(preparado_id);
CREATE INDEX idx_produtos_finais_user_id ON public.produtos_finais(user_id);
CREATE INDEX idx_produtos_finais_itens_user_id ON public.produtos_finais_itens(user_id);
CREATE INDEX idx_produtos_finais_itens_produto_id ON public.produtos_finais_itens(produto_id);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_preparados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_preparados_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_finais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_finais_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para INSUMOS
CREATE POLICY "Users can view their own insumos"
  ON public.insumos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insumos"
  ON public.insumos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insumos"
  ON public.insumos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insumos"
  ON public.insumos FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para PRODUTOS PREPARADOS
CREATE POLICY "Users can view their own produtos_preparados"
  ON public.produtos_preparados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos_preparados"
  ON public.produtos_preparados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos_preparados"
  ON public.produtos_preparados FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos_preparados"
  ON public.produtos_preparados FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para PRODUTOS PREPARADOS ITENS
CREATE POLICY "Users can view their own produtos_preparados_itens"
  ON public.produtos_preparados_itens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos_preparados_itens"
  ON public.produtos_preparados_itens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos_preparados_itens"
  ON public.produtos_preparados_itens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos_preparados_itens"
  ON public.produtos_preparados_itens FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para PRODUTOS FINAIS
CREATE POLICY "Users can view their own produtos_finais"
  ON public.produtos_finais FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos_finais"
  ON public.produtos_finais FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos_finais"
  ON public.produtos_finais FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos_finais"
  ON public.produtos_finais FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para PRODUTOS FINAIS ITENS
CREATE POLICY "Users can view their own produtos_finais_itens"
  ON public.produtos_finais_itens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos_finais_itens"
  ON public.produtos_finais_itens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos_finais_itens"
  ON public.produtos_finais_itens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos_finais_itens"
  ON public.produtos_finais_itens FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.insumos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.produtos_preparados
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.produtos_finais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();