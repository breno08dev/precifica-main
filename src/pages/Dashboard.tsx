import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Package, ChefHat, ShoppingBag, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Tipos auxiliares
type DashboardStats = {
  totalInsumos: number;
  totalPreparados: number;
  totalProdutos: number;
  cmvMedio: number;
  lucroMedio: number;
  produtosAlerta: any[];
  produtosGrafico: any[];
  categoriasInsumos: any[];
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInsumos: 0,
    totalPreparados: 0,
    totalProdutos: 0,
    cmvMedio: 0,
    lucroMedio: 0,
    produtosAlerta: [],
    produtosGrafico: [],
    categoriasInsumos: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Buscando dados em paralelo
      const [insumosRes, preparadosRes, produtosRes] = await Promise.all([
        supabase.from("insumos").select("id, categoria, preco_compra"),
        supabase.from("produtos_preparados").select("id"),
        supabase.from("produtos_finais").select("*"),
      ]);

      const insumos = insumosRes.data || [];
      const preparados = preparadosRes.data || [];
      const produtos = produtosRes.data || [];

      // 1. Cálculos de Produtos (CMV, Lucro)
      let somaCmv = 0;
      let somaLucro = 0;
      let produtosComAlerta: any[] = [];
      
      const produtosFormatados = produtos.map(p => {
        const cmv = p.preco_venda > 0 ? (p.custo_total / p.preco_venda) * 100 : 0;
        const lucro = p.preco_venda - p.custo_total;
        
        somaCmv += cmv;
        somaLucro += lucro;

        // Se CMV > 32%, adiciona aos alertas
        if (cmv > 32) {
          produtosComAlerta.push({ ...p, cmv });
        }

        return {
          name: p.nome,
          Venda: p.preco_venda,
          Custo: p.custo_total,
          Lucro: lucro
        };
      });

      // Ordenar alertas pelos piores CMVs (maiores)
      produtosComAlerta.sort((a, b) => b.cmv - a.cmv);

      // 2. Categorias de Insumos para Gráfico
      const categoriasMap = insumos.reduce((acc: any, curr) => {
        const cat = curr.categoria || "Outros";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const dadosCategorias = Object.entries(categoriasMap).map(([name, value]) => ({ name, value }));

      setStats({
        totalInsumos: insumos.length,
        totalPreparados: preparados.length,
        totalProdutos: produtos.length,
        cmvMedio: produtos.length > 0 ? somaCmv / produtos.length : 0,
        lucroMedio: produtos.length > 0 ? somaLucro / produtos.length : 0,
        produtosAlerta: produtosComAlerta,
        produtosGrafico: produtosFormatados.slice(0, 7), // Pegar apenas os primeiros 7 para o gráfico não ficar polúido
        categoriasInsumos: dadosCategorias
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Cores para gráficos
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da saúde financeira do seu negócio.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Sistema Online
        </div>
      </div>

      {/* KPI Cards (Indicadores Principais) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card CMV Médio */}
        <Card className={`border-l-4 ${stats.cmvMedio <= 32 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Médio Global</CardTitle>
            <TrendingUp className={`h-4 w-4 ${stats.cmvMedio <= 32 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cmvMedio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: 32% ({stats.cmvMedio <= 32 ? 'Atingida' : 'Acima da meta'})
            </p>
          </CardContent>
        </Card>

        {/* Card Lucro Médio */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Médio / Item</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lucroMedio)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem de contribuição média
            </p>
          </CardContent>
        </Card>

        {/* Card Produtos Cadastrados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Finais</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProdutos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens no cardápio
            </p>
          </CardContent>
        </Card>

        {/* Card Insumos e Receitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Dados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInsumos + stats.totalPreparados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalInsumos} insumos, {stats.totalPreparados} receitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal - Gráficos e Alertas */}
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* Gráfico Principal (Ocupa 4 colunas) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Análise de Lucratividade</CardTitle>
            <CardDescription>Comparativo entre Preço de Venda, Custo e Lucro dos produtos recentes.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.produtosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Custo" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} name="Custo Total" />
                <Bar dataKey="Lucro" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro Líquido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Painel de Alertas (Ocupa 3 colunas) */}
        <Card className="col-span-4 md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Atenção ao CMV
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                Meta: 32%
              </Badge>
            </div>
            <CardDescription>Produtos com custo acima do ideal.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {stats.produtosAlerta.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-10">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <p>Parabéns! Todos os produtos estão dentro da meta.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.produtosAlerta.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{prod.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Venda: {formatCurrency(prod.preco_venda)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-red-600 font-bold">
                          {prod.cmv.toFixed(1)}%
                          <ArrowUpRight className="h-3 w-3" />
                        </div>
                        <p className="text-xs text-muted-foreground">CMV Atual</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Secundário (Categorias) */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Insumos</CardTitle>
            <CardDescription>Categorias de ingredientes cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {stats.categoriasInsumos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoriasInsumos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.categoriasInsumos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de categorias.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Resumo Rápido */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Dica do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O <strong>CMV (Custo da Mercadoria Vendida)</strong> é seu principal indicador de eficiência. 
              Se ele estiver alto ({'>'} 32%), considere:
            </p>
            <ul className="text-sm space-y-2 list-disc pl-4 text-foreground/80">
              <li>Renegociar preços de insumos com fornecedores.</li>
              <li>Revisar as fichas técnicas (evitar desperdício).</li>
              <li>Ajustar o preço de venda dos produtos em alerta.</li>
              <li>Promover produtos com maior margem de lucro.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}