import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Sparkles, Zap, Smartphone, QrCode } from "lucide-react";

const PLANOS = {

  mensal: {
    id: "price_1SYFs6HcLElAFxo9byjWDIEx",
    nome: "Mensal",
    preco: "R$ 39,90",
    periodo: "/mês",
    destaque: false,
  },
  anual: {
    id: "price_1SYFsbHcLElAFxo9uBYRuIqA",
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

      if (error) throw error;
      if (!data?.url) throw new Error("Link de pagamento não recebido");

      window.location.href = data.url;

    } catch (error: any) {
      console.error("Erro:", error);
      toast({ 
        title: "Erro ao iniciar pagamento", 
        description: "Tente novamente ou chame no suporte.",
        variant: "destructive" 
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePixWhatsapp = () => {
    // Mensagem pré-definida
    const text = encodeURIComponent("Olá! Gostaria de assinar o PrecificaAi PRO via PIX.");
    // Seu número (peguei do arquivo Manual.tsx)
    const phone = "5516988392871"; 
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center justify-center gap-2">
          PrecificaAi <span className="text-primary">Pro</span> <Sparkles className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-xl text-muted-foreground">
          Escolha a melhor forma de pagamento para o seu negócio.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full">
        
        {/* Opção 1: PIX (WhatsApp) - NOVA OPÇÃO */}
        <Card className="border-green-200 bg-green-50/30 hover:border-green-500/50 transition-all hover:shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            LIBERAÇÃO RÁPIDA
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <QrCode className="h-5 w-5" />
              Pagamento via PIX
            </CardTitle>
            <CardDescription>Fale direto comigo no WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-foreground">R$ 29,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600" /> Sem cartão de crédito</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600" /> Atendimento humano</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-600" /> Desconto na renovação</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md" 
              onClick={handlePixWhatsapp}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Pagar no PIX
            </Button>
          </CardFooter>
        </Card>

        {/* Opção 2: Cartão Mensal */}
        <Card className="border-muted hover:border-primary/50 transition-all hover:shadow-md opacity-90">
          <CardHeader>
            <CardTitle>{PLANOS.mensal.nome}</CardTitle>
            <CardDescription>Cobrança automática no cartão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">{PLANOS.mensal.preco}</span>
              <span className="text-muted-foreground">{PLANOS.mensal.periodo}</span>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4" /> Acesso imediato</li>
              <li className="flex gap-2"><Check className="h-4 w-4" /> Cancele quando quiser</li>
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
              Assinar Cartão
            </Button>
          </CardFooter>
        </Card>

        {/* Opção 3: Cartão Anual */}
        <Card className="border-primary shadow-xl relative overflow-hidden transform md:-translate-y-2 transition-transform hover:-translate-y-4">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
            MELHOR CUSTO
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {PLANOS.anual.nome}
            </CardTitle>
            <Badge variant="secondary" className="text-green-600 bg-green-100 border-none w-fit mt-1">
              {PLANOS.anual.economia}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">{PLANOS.anual.preco}</span>
              <span className="text-muted-foreground">{PLANOS.anual.periodo}</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> <b>Tudo do Mensal</b></li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> 2 Meses Grátis</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full shadow-md" 
              disabled={!!loading}
              onClick={() => handleCheckout(PLANOS.anual.id, 'anual')}
            >
              {loading === 'anual' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Zap className="mr-2 h-5 w-5 fill-current" />
              )}
              Economizar Agora
            </Button>
          </CardFooter>
        </Card>

      </div>
      
      <p className="mt-12 text-xs text-muted-foreground text-center max-w-md">
        Pagamentos no cartão são processados de forma segura pela Stripe. <br/>
        Para PIX, a liberação é feita manualmente pela nossa equipe após o comprovante.
      </p>
    </div>
  );
}