import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentLockProps {
  children: React.ReactNode;
}

export function ContentLock({ children }: ContentLockProps) {
  const { isPro, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Se for PRO, libera o conteúdo total
  if (isPro) {
    return <>{children}</>;
  }

  // Se NÃO for PRO, mostra o conteúdo censurado
  return (
    <div className="relative w-full">
      {/* Conteúdo "Censurado" ao fundo */}
      <div className="blur-md select-none pointer-events-none opacity-50 grayscale transition-all duration-500">
        {children}
      </div>

      {/* Camada de Bloqueio por cima */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-transparent via-background/60 to-background">
        <div className="bg-card border border-border/50 shadow-2xl p-8 rounded-2xl max-w-md text-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            Funcionalidade <span className="text-primary">Pro</span> <Sparkles className="w-5 h-5 text-yellow-500" />
          </h2>
          
          <p className="text-muted-foreground mb-8">
            Desbloqueie o gerenciamento completo de Insumos, Receitas e Cardápios para maximizar seu lucro.
          </p>

          <Button 
            size="lg" 
            className="w-full text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all"
            onClick={() => navigate("/assinatura")}
          >
            Quero Desbloquear Agora
          </Button>
          
          <p className="mt-4 text-xs text-muted-foreground">
            A partir de R$ 39,90/mês. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
}