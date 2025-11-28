import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Store, 
  Lightbulb,
  Check,
  MessageSquare,
  BarChart3
} from "lucide-react";

export default function Manual() {
  
  const handleWhatsappClick = () => {
    window.open("https://wa.me/5516988392871", "_blank");
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Minimalista */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentação</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Guia de implementação e boas práticas de precificação.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,350px]">
        
        {/* Coluna Principal */}
        <div className="space-y-6">
          <Card className="border shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Jornada de Precificação</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                
                {/* ETAPA 01 */}
                <AccordionItem value="item-1" className="px-6 border-b last:border-0">
                  {/* REMOVIDO: hover:bg-muted/50 */}
                  <AccordionTrigger className="py-6 hover:no-underline transition-colors group">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex items-center justify-center h-8 w-8 rounded border border-muted-foreground/20 text-muted-foreground text-sm font-medium group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:border-primary transition-all">
                        01
                      </span>
                      <div>
                        <span className="block font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Cadastro de Insumos</span>
                        <span className="block text-sm text-muted-foreground font-normal">A base de dados da sua cozinha</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-[3.25rem] pb-6 text-muted-foreground space-y-4">
                    <p className="leading-relaxed">
                      O primeiro passo é digitalizar seu estoque. Insumos são os itens elementares comprados de fornecedores.
                    </p>
                    <div className="bg-muted/30 p-4 rounded border border-muted space-y-3">
                      <div className="flex gap-3">
                        <Package className="h-5 w-5 text-primary shrink-0" />
                        <div className="text-sm">
                          <strong className="text-foreground block mb-1">Dica Profissional</strong>
                          Sempre cadastre o valor da <u>embalagem fechada</u>. O sistema fará a matemática de conversão (Kg → g, L → ml) automaticamente nas fichas técnicas.
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ETAPA 02 */}
                <AccordionItem value="item-2" className="px-6 border-b last:border-0">
                  <AccordionTrigger className="py-6 hover:no-underline transition-colors group">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex items-center justify-center h-8 w-8 rounded border border-muted-foreground/20 text-muted-foreground text-sm font-medium group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:border-primary transition-all">
                        02
                      </span>
                      <div>
                        <span className="block font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Produtos Preparados</span>
                        <span className="block text-sm text-muted-foreground font-normal">Receitas intermediárias (Mise en place)</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-[3.25rem] pb-6 text-muted-foreground space-y-4">
                    <p className="leading-relaxed">
                      Crie fichas técnicas para itens produzidos internamente que servirão de base para outros pratos.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Exemplos: Molhos, massas, recheios pré-prontos.
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Defina o rendimento final para obter o custo exato por porção.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* ETAPA 03 */}
                <AccordionItem value="item-3" className="px-6 border-b last:border-0">
                  <AccordionTrigger className="py-6 hover:no-underline transition-colors group">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex items-center justify-center h-8 w-8 rounded border border-muted-foreground/20 text-muted-foreground text-sm font-medium group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:border-primary transition-all">
                        03
                      </span>
                      <div>
                        <span className="block font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Produtos Finais (Cardápio)</span>
                        <span className="block text-sm text-muted-foreground font-normal">Definição de preço e venda</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-[3.25rem] pb-6 text-muted-foreground space-y-4">
                    <p className="leading-relaxed">
                      A etapa final onde você combina <strong>Insumos</strong> e <strong>Preparados</strong> para compor o prato de venda.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-foreground bg-primary/5 p-3 rounded border border-primary/10">
                      <Store className="h-4 w-4 text-primary" />
                      <span>O sistema calculará automaticamente se o Preço de Venda cobre os custos.</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ETAPA 04 */}
                <AccordionItem value="item-4" className="px-6 border-b last:border-0">
                  <AccordionTrigger className="py-6 hover:no-underline transition-colors group">
                    <div className="flex items-center gap-4 text-left">
                      <span className="flex items-center justify-center h-8 w-8 rounded border border-muted-foreground/20 text-muted-foreground text-sm font-medium group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:border-primary transition-all">
                        04
                      </span>
                      <div>
                        <span className="block font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Análise de Métricas</span>
                        <span className="block text-sm text-muted-foreground font-normal">Interpretação do Dashboard</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-[3.25rem] pb-6 text-muted-foreground space-y-4">
                    <p className="leading-relaxed">
                      Monitore a saúde financeira através dos indicadores de CMV (Custo da Mercadoria Vendida).
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border p-3 rounded bg-background">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">CMV Ideal</span>
                        <div className="text-lg font-bold text-green-600">Abaixo de 32%</div>
                      </div>
                      <div className="border p-3 rounded bg-background">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Ação Necessária</span>
                        <div className="text-sm font-medium mt-1">Renegociar ou Reprecificar</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Insights e Suporte */}
        <div className="space-y-6">
          
          {/* Card Conceito */}
          <Card className="border-none shadow-none bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                Conceito Chave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">O que é CMV?</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  É a porcentagem do seu faturamento que é consumida pelos custos dos ingredientes. Quanto menor, maior sua margem.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Card de Suporte - Clean e Direto */}
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="font-semibold text-foreground">Precisa de ajuda especializada?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nossa equipe de suporte está disponível para auxiliar na configuração do seu cardápio.
              </p>
            </div>
            
            <Button 
              onClick={handleWhatsappClick}
              className="w-full h-12 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-sm transition-all duration-300 flex items-center justify-between px-6 group"
            >
              <span className="font-semibold">Falar no WhatsApp</span>
              <MessageSquare className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Disponível seg-sex das 09h às 18h
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}