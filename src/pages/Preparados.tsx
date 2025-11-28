import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, ChefHat, Scale } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProdutoPreparado, Insumo } from "@/types/database";
import { ContentLock } from "@/components/ContentLock";

const UNIDADES_RENDIMENTO = [
  { value: "kg", label: "Quilogramas (kg)", suffix: "kg", factor: 1000 },
  { value: "l", label: "Litros (l)", suffix: "l", factor: 1000 },
  { value: "un", label: "Unidades (un)", suffix: "un", factor: 1 },
  { value: "porcao", label: "Porções", suffix: "porções", factor: 1 },
];

type ItemReceita = {
  id_temp: string;
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  nome: string;
  unidade_uso: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
};

export default function Preparados() {
  const [preparados, setPreparados] = useState<ProdutoPreparado[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [nomeReceita, setNomeReceita] = useState("");
  const [rendimentoQtd, setRendimentoQtd] = useState("");
  const [rendimentoUnidade, setRendimentoUnidade] = useState("un"); 
  
  const [itensReceita, setItensReceita] = useState<ItemReceita[]>([]);

  const [ingredienteSelecionadoId, setIngredienteSelecionadoId] = useState("");
  const [qtdIngrediente, setQtdIngrediente] = useState("");

  const [custoTotalReceita, setCustoTotalReceita] = useState(0);
  const [custoPorUnidade, setCustoPorUnidade] = useState(0);

  useEffect(() => {
    fetchPreparados();
    fetchInsumos();
  }, []);

  useEffect(() => {
    const total = itensReceita.reduce((acc, item) => acc + item.custo_total, 0);
    setCustoTotalReceita(total);

    const qtdRendimentoVisual = parseFloat(rendimentoQtd) || 0;

    if (qtdRendimentoVisual > 0) {
      setCustoPorUnidade(total / qtdRendimentoVisual);
    } else {
      setCustoPorUnidade(0);
    }
  }, [itensReceita, rendimentoQtd]);

  const fetchPreparados = async () => {
    const { data, error } = await supabase
      .from("produtos_preparados")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Erro ao carregar preparados", variant: "destructive" });
    else setPreparados(data || []);
  };

  const fetchInsumos = async () => {
    const { data } = await supabase.from("insumos").select("*").order("nome");
    setInsumos(data || []);
  };

  const adicionarIngrediente = () => {
    if (!ingredienteSelecionadoId || !qtdIngrediente) return;

    let nomeItem = "";
    let unidadeItem = "";
    let custoRealUnitario = 0;
    let tipo: 'insumo' | 'preparado' = 'insumo';

    const insumo = insumos.find(i => i.id === ingredienteSelecionadoId);
    
    if (insumo) {
      nomeItem = insumo.nome;
      unidadeItem = insumo.unidade_de_uso;
      custoRealUnitario = insumo.preco_compra / insumo.quantidade_comprada;
    } else {
      const prep = preparados.find(p => p.id === ingredienteSelecionadoId);
      if (prep) {
        nomeItem = prep.nome;
        unidadeItem = "un"; 
        custoRealUnitario = (prep.custo_por_unidade || 0); 
        tipo = 'preparado';
      } else {
        return;
      }
    }

    const qtd = parseFloat(qtdIngrediente);
    const custoItem = custoRealUnitario * qtd;

    const novoItem: ItemReceita = {
      id_temp: Math.random().toString(36).substr(2, 9),
      item_id: ingredienteSelecionadoId,
      tipo_item: tipo,
      nome: nomeItem,
      unidade_uso: unidadeItem,
      quantidade: qtd,
      custo_unitario: custoRealUnitario,
      custo_total: custoItem
    };

    setItensReceita([...itensReceita, novoItem]);
    setIngredienteSelecionadoId("");
    setQtdIngrediente("");
  };

  const removerItem = (id_temp: string) => {
    setItensReceita(itensReceita.filter(i => i.id_temp !== id_temp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (itensReceita.length === 0) {
      toast({ title: "Adicione pelo menos um ingrediente", variant: "destructive" });
      return;
    }

    const unidadeInfo = UNIDADES_RENDIMENTO.find(u => u.value === rendimentoUnidade);
    const fator = unidadeInfo ? unidadeInfo.factor : 1; 
    
    const rendimentoParaBanco = (parseFloat(rendimentoQtd) || 0) * fator;

    const preparadoPayload = {
      nome: nomeReceita,
      rendimento_total: rendimentoParaBanco, 
      custo_total: custoTotalReceita,
      // user_id removido: O banco insere automaticamente via DEFAULT auth.uid()
    };

    let preparadoId = editingId;

    if (editingId) {
      const { error } = await supabase
        .from("produtos_preparados")
        .update(preparadoPayload)
        .eq("id", editingId);

      if (error) {
        console.error("Erro update:", error);
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }
      
      await supabase.from("produtos_preparados_itens").delete().eq("preparado_id", editingId);
    } else {
      const { data, error } = await supabase
        .from("produtos_preparados")
        .insert(preparadoPayload)
        .select()
        .single();

      if (error || !data) {
        console.error("Erro create:", error);
        toast({ title: "Erro ao criar", description: error?.message, variant: "destructive" });
        return;
      }
      preparadoId = data.id;
    }

    if (preparadoId) {
      const itensParaSalvar = itensReceita.map(item => ({
        preparado_id: preparadoId,
        // user_id removido
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade,
        custo: item.custo_total,
      }));

      const { error } = await supabase.from("produtos_preparados_itens").insert(itensParaSalvar);
      if (error) console.error("Erro ao salvar itens:", error);
    }

    toast({ title: editingId ? "Receita atualizada!" : "Receita criada com sucesso!" });
    setOpen(false);
    resetForm();
    fetchPreparados();
  };

  const handleEdit = async (preparado: ProdutoPreparado) => {
    setEditingId(preparado.id);
    setNomeReceita(preparado.nome);
    setRendimentoQtd(preparado.rendimento_total.toString());
    setRendimentoUnidade("un"); 

    const { data: itensData } = await supabase
      .from("produtos_preparados_itens")
      .select("*")
      .eq("preparado_id", preparado.id);

    if (itensData) {
      const itensMapeados: ItemReceita[] = itensData.map(item => {
        let nome = "Item Removido";
        let unidade = "un";
        
        if (item.tipo_item === 'insumo') {
          const insumoEncontrado = insumos.find(i => i.id === item.item_id);
          if (insumoEncontrado) {
            nome = insumoEncontrado.nome;
            unidade = insumoEncontrado.unidade_de_uso;
          }
        } else {
          const prepEncontrado = preparados.find(p => p.id === item.item_id);
          if (prepEncontrado) {
            nome = prepEncontrado.nome;
            unidade = "un";
          }
        }

        return {
          id_temp: Math.random().toString(),
          item_id: item.item_id,
          tipo_item: item.tipo_item as 'insumo' | 'preparado',
          nome: nome,
          unidade_uso: unidade,
          quantidade: item.quantidade_usada,
          custo_total: item.custo,
          custo_unitario: item.quantidade_usada > 0 ? item.custo / item.quantidade_usada : 0
        };
      });
      setItensReceita(itensMapeados);
    }

    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("produtos_preparados").delete().eq("id", id);
    if (!error) {
      toast({ title: "Excluído com sucesso" });
      fetchPreparados();
    }
  };

  const resetForm = () => {
    setNomeReceita("");
    setRendimentoQtd("");
    setRendimentoUnidade("un");
    setItensReceita([]);
    setEditingId(null);
    setCustoTotalReceita(0);
    setCustoPorUnidade(0);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL", 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);

  return (
    <ContentLock>
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos Preparados</h1>
          <p className="text-muted-foreground mt-1">Crie fichas técnicas das suas receitas (ex: Molho da Casa, Massa).</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md">
              <ChefHat className="mr-2 h-5 w-5" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingId ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}</DialogTitle>
              <DialogDescription>
                Monte a composição do seu produto e descubra o custo real.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 pr-2">
              <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Receita</Label>
                    <Input 
                      placeholder="Ex: Molho de Tomate Especial" 
                      value={nomeReceita}
                      onChange={e => setNomeReceita(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Rendimento Total</Label>
                      <Input 
                        type="number" 
                        placeholder="Ex: 120"
                        value={rendimentoQtd}
                        onChange={e => setRendimentoQtd(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Select value={rendimentoUnidade} onValueChange={setRendimentoUnidade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNIDADES_RENDIMENTO.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base text-primary font-semibold flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Composição (Ingredientes)
                    </Label>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border grid grid-cols-[1fr,auto,auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Selecionar Insumo</Label>
                      <Select value={ingredienteSelecionadoId} onValueChange={setIngredienteSelecionadoId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Busque um ingrediente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {insumos.length > 0 && <SelectItem value="header-insumos" disabled className="font-bold opacity-100">--- Insumos ---</SelectItem>}
                          {insumos.map(insumo => (
                            <SelectItem key={insumo.id} value={insumo.id}>
                              {insumo.nome} ({insumo.unidade_de_uso})
                            </SelectItem>
                          ))}
                          
                          {preparados.length > 0 && <SelectItem value="header-preparados" disabled className="font-bold opacity-100 border-t mt-2">--- Outras Receitas ---</SelectItem>}
                          {preparados
                            .filter(p => p.id !== editingId)
                            .map(prep => (
                            <SelectItem key={prep.id} value={prep.id}>
                              {prep.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 w-32">
                      <Label className="text-xs text-muted-foreground">Qtd. Usada</Label>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="0.00"
                        className="bg-background"
                        value={qtdIngrediente}
                        onChange={e => setQtdIngrediente(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={adicionarIngrediente} variant="secondary">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground grid grid-cols-[1fr,auto,auto,auto] gap-4">
                      <span>Item</span>
                      <span className="text-right">Qtd.</span>
                      <span className="text-right">Custo</span>
                      <span className="w-8"></span>
                    </div>
                    <ScrollArea className="h-[200px]">
                      {itensReceita.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
                          <p>Nenhum ingrediente adicionado ainda.</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {itensReceita.map((item) => (
                            <div key={item.id_temp} className="px-4 py-3 grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center hover:bg-muted/20 transition-colors">
                              <span className="text-sm font-medium">{item.nome}</span>
                              <span className="text-sm text-right font-mono text-muted-foreground">
                                {item.quantidade} {item.unidade_uso}
                              </span>
                              <span className="text-sm text-right font-mono font-medium">
                                {formatCurrency(item.custo_total)}
                              </span>
                              <div className="flex justify-end">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => removerItem(item.id_temp)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t pt-4 mt-auto bg-background">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Custo Total da Receita</span>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(custoTotalReceita)}
                  </div>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <span className="text-xs text-primary uppercase tracking-wider font-semibold">Custo por {UNIDADES_RENDIMENTO.find(u => u.value === rendimentoUnidade)?.label}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(custoPorUnidade)}
                    </span>
                    {rendimentoUnidade !== 'un' && (
                        <span className="text-xs text-muted-foreground">
                        / {UNIDADES_RENDIMENTO.find(u => u.value === rendimentoUnidade)?.suffix || 'un'}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              <Button type="submit" form="recipe-form" className="w-full" size="lg">
                {editingId ? "Atualizar Ficha Técnica" : "Salvar Ficha Técnica"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {preparados.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Nenhuma receita cadastrada</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Crie fichas técnicas para seus molhos, massas e recheios para saber o custo exato.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
                    Criar Primeira Receita
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {preparados.map((prep) => (
            <Card key={prep.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleEdit(prep)}>
                <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{prep.nome}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(prep)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(prep.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                </div>
                <CardDescription>
                    Rendimento: {prep.rendimento_total}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg mt-2">
                    <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">Custo Unitário</span>
                    <div className="font-bold text-primary">
                        {formatCurrency(prep.custo_por_unidade || 0)}
                    </div>
                    </div>
                    <div className="h-8 w-[1px] bg-border mx-2"></div>
                    <div className="space-y-0.5 text-right">
                    <span className="text-xs text-muted-foreground">Custo Total</span>
                    <div className="font-medium">
                        {formatCurrency(prep.custo_total)}
                    </div>
                    </div>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
      )}
    </div>
  </ContentLock>
  );
}