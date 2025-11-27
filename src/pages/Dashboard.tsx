import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Beaker, ShoppingBag, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    insumos: 0,
    preparados: 0,
    produtos: 0,
    margemMedia: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [insumosRes, preparadosRes, produtosRes] = await Promise.all([
        supabase.from("insumos").select("id", { count: "exact", head: true }),
        supabase.from("produtos_preparados").select("id", { count: "exact", head: true }),
        supabase.from("produtos_finais").select("margem_lucro"),
      ]);

      const margens = produtosRes.data?.map(p => p.margem_lucro).filter(m => m !== null) as number[] || [];
      const margemMedia = margens.length > 0 
        ? margens.reduce((a, b) => a + b, 0) / margens.length 
        : 0;

      setStats({
        insumos: insumosRes.count || 0,
        preparados: preparadosRes.count || 0,
        produtos: produtosRes.data?.length || 0,
        margemMedia: Math.round(margemMedia * 10) / 10,
      });
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Insumos",
      value: stats.insumos,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Produtos Preparados",
      value: stats.preparados,
      icon: Beaker,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Produtos Finais",
      value: stats.produtos,
      icon: ShoppingBag,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Margem Média",
      value: `${stats.margemMedia}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
