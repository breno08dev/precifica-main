import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // <--- O IMPORT QUE FALTAVA
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";

// Substitua pelos seus IDs de preço da Stripe REAIS
const PLANOS = {
  mensal: {
    id: "price_1SYFzzRMYU0tPtvw8gyYCoWO",
    nome: "Mensal",
    preco: "R$ 39,90",
    periodo: "/mês",
    destaque: false,
  },
  anual: {
    id: "price_1SYG0HRMYU0tPtvwsUhgl67u",
    nome: "Anual",
    preco: "R$ 397,00",
    periodo: "/ano",
    economia: "Economize R$ 81,80",
    destaque: true,
  }
};

export default function Assinatura() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

    const handleCheckout = async (priceId: string, plano: string) => {
    try {
      setLoading(plano);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ title: "Faça login primeiro", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          price_id: priceId,
          user_id: session.user.id,
          return_url: window.location.origin + "/dashboard" 
        },
      });

      if (error) {
        // Tenta ler a mensagem de erro que o backend enviou
        let errorMessage = "Erro desconhecido";
        try {
            // O corpo da resposta de erro vem aqui
            const errorBody = await error.context.json();
            errorMessage = errorBody.error || error.message;
        } catch {
            errorMessage = error.message || "Falha na comunicação com o servidor";
        }
        throw new Error(errorMessage);
      }

      if (!data?.url) throw new Error("Link de pagamento não recebido");

      window.location.href = data.url;

    } catch (error: any) {
      console.error("Erro detalhado:", error);
      toast({ 
        title: "Erro ao iniciar pagamento", 
        description: error.message, // Agora vai mostrar o motivo real!
        variant: "destructive" 
      });
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center justify-center gap-2">
          PrecificaAi <span className="text-primary">Pro</span> <Sparkles className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-xl text-muted-foreground">
          Desbloqueie todo o potencial do seu negócio. Precifique sem limites e garanta seu lucro.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Plano Mensal */}
        <Card className="border-muted hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle>{PLANOS.mensal.nome}</CardTitle>
            <CardDescription>Flexibilidade total para você.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold">{PLANOS.mensal.preco}</span>
              <span className="text-muted-foreground">{PLANOS.mensal.periodo}</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Receitas Ilimitadas</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Cardápio Completo</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Suporte Prioritário</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              disabled={!!loading}
              onClick={() => handleCheckout(PLANOS.mensal.id, 'mensal')}
            >
              {loading === 'mensal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assinar Mensal
            </Button>
          </CardFooter>
        </Card>

        {/* Plano Anual */}
        <Card className="border-primary shadow-xl relative overflow-hidden transform md:-translate-y-4 transition-transform hover:-translate-y-6">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
            MAIS POPULAR
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {PLANOS.anual.nome}
              <Badge variant="secondary" className="text-green-600 bg-green-100 border-none hover:bg-green-200">
                {PLANOS.anual.economia}
              </Badge>
            </CardTitle>
            <CardDescription>Compromisso sério com seu lucro.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold">{PLANOS.anual.preco}</span>
              <span className="text-muted-foreground">{PLANOS.anual.periodo}</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> <b>Tudo do Mensal</b></li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> 2 Meses Grátis</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> Acesso a novas features beta</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full text-lg h-12 shadow-md" 
              disabled={!!loading}
              onClick={() => handleCheckout(PLANOS.anual.id, 'anual')}
            >
              {loading === 'anual' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Zap className="mr-2 h-5 w-5 fill-current" />
              )}
              Quero Economizar Agora
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <p className="mt-8 text-xs text-muted-foreground">
        Pagamento seguro processado pela Stripe. Cancele quando quiser.
      </p>
    </div>
  );
}