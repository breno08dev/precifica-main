import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, ShoppingBag, Scale, DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProdutoFinal, Insumo, ProdutoPreparado } from "@/types/database";
import { ContentLock } from "@/components/ContentLock";

type ItemProduto = {
  id_temp: string;
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  nome: string;
  unidade_uso: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<ProdutoFinal[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [preparados, setPreparados] = useState<ProdutoPreparado[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [nomeProduto, setNomeProduto] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");

  const [itensReceita, setItensReceita] = useState<ItemProduto[]>([]);
  const [itemSelecionadoId, setItemSelecionadoId] = useState("");
  const [qtdItem, setQtdItem] = useState("");

  const [custoTotal, setCustoTotal] = useState(0);
  const [cmv, setCmv] = useState(0); 
  const [lucroLiquido, setLucroLiquido] = useState(0);

  useEffect(() => {
    fetchProdutos();
    fetchInsumos();
    fetchPreparados();
  }, []);

  useEffect(() => {
    const totalCusto = itensReceita.reduce((acc, item) => acc + item.custo_total, 0);
    setCustoTotal(totalCusto);

    const venda = parseFloat(precoVenda) || 0;
    
    if (venda > 0 && totalCusto > 0) {
      const lucro = venda - totalCusto;
      setLucroLiquido(lucro);
      setCmv((totalCusto / venda) * 100);
    } else {
      setLucroLiquido(0);
      setCmv(0);
    }
  }, [itensReceita, precoVenda]);

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos_finais")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Erro ao carregar produtos", variant: "destructive" });
    else setProdutos(data || []);
  };

  const fetchInsumos = async () => {
    const { data } = await supabase.from("insumos").select("*").order("nome");
    setInsumos(data || []);
  };

  const fetchPreparados = async () => {
    const { data } = await supabase.from("produtos_preparados").select("*").order("nome");
    setPreparados(data || []);
  };

  const adicionarItem = () => {
    if (!itemSelecionadoId || !qtdItem) return;

    let nomeItem = "";
    let unidadeItem = "";
    let custoRealUnitario = 0;
    let tipo: 'insumo' | 'preparado' = 'insumo';

    const insumo = insumos.find(i => i.id === itemSelecionadoId);
    
    if (insumo) {
      nomeItem = insumo.nome;
      unidadeItem = insumo.unidade_de_uso;
      custoRealUnitario = insumo.preco_compra / insumo.quantidade_comprada;
    } else {
      const prep = preparados.find(p => p.id === itemSelecionadoId);
      if (prep) {
        nomeItem = prep.nome;
        unidadeItem = "un/porção"; 
        custoRealUnitario = (prep.custo_por_unidade || 0); 
        tipo = 'preparado';
      } else {
        return;
      }
    }

    const qtd = parseFloat(qtdItem);
    const custoItem = custoRealUnitario * qtd;

    const novoItem: ItemProduto = {
      id_temp: Math.random().toString(36).substr(2, 9),
      item_id: itemSelecionadoId,
      tipo_item: tipo,
      nome: nomeItem,
      unidade_uso: unidadeItem,
      quantidade: qtd,
      custo_unitario: custoRealUnitario,
      custo_total: custoItem
    };

    setItensReceita([...itensReceita, novoItem]);
    setItemSelecionadoId("");
    setQtdItem("");
  };

  const removerItem = (id_temp: string) => {
    setItensReceita(itensReceita.filter(i => i.id_temp !== id_temp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (itensReceita.length === 0) {
      toast({ title: "Adicione a composição do produto", variant: "destructive" });
      return;
    }

    const produtoPayload = {
      nome: nomeProduto,
      preco_venda: parseFloat(precoVenda),
      custo_total: custoTotal, 
      // user_id removido: O banco insere automaticamente via DEFAULT auth.uid()
    };

    let produtoId = editingId;

    if (editingId) {
      const { error } = await supabase
        .from("produtos_finais")
        .update(produtoPayload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        return;
      }
      
      await supabase.from("produtos_finais_itens").delete().eq("produto_id", editingId);
    } else {
      const { data, error } = await supabase
        .from("produtos_finais")
        .insert(produtoPayload)
        .select()
        .single();

      if (error || !data) {
        toast({ title: "Erro ao criar produto", variant: "destructive" });
        return;
      }
      produtoId = data.id;
    }

    if (produtoId) {
      const itensParaSalvar = itensReceita.map(item => ({
        produto_id: produtoId,
        // user_id removido
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade,
        custo: item.custo_total,
      }));

      const { error } = await supabase.from("produtos_finais_itens").insert(itensParaSalvar);
      if (error) console.error("Erro ao salvar itens:", error);
    }

    toast({ title: editingId ? "Produto atualizado!" : "Produto criado com sucesso!" });
    setOpen(false);
    resetForm();
    fetchProdutos();
  };

  const handleEdit = async (produto: ProdutoFinal) => {
    setEditingId(produto.id);
    setNomeProduto(produto.nome);
    setPrecoVenda(produto.preco_venda.toString());

    const { data: itensData } = await supabase
      .from("produtos_finais_itens")
      .select("*")
      .eq("produto_id", produto.id);

    if (itensData) {
      const itensReconstruidos: ItemProduto[] = itensData.map(item => {
        let nome = "Item Removido";
        let unidade = "?";
        
        if (item.tipo_item === 'insumo') {
          const insumo = insumos.find(i => i.id === item.item_id);
          if (insumo) {
            nome = insumo.nome;
            unidade = insumo.unidade_de_uso;
          }
        } else {
          const prep = preparados.find(p => p.id === item.item_id);
          if (prep) {
            nome = prep.nome;
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
      setItensReceita(itensReconstruidos);
    }

    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("produtos_finais").delete().eq("id", id);
    if (!error) {
      toast({ title: "Produto excluído!" });
      fetchProdutos();
    }
  };

  const resetForm = () => {
    setNomeProduto("");
    setPrecoVenda("");
    setItensReceita([]);
    setEditingId(null);
    setCustoTotal(0);
    setCmv(0);
    setLucroLiquido(0);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL", 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);

  const getCmvStatus = (percent: number) => {
    if (percent <= 32) return "bg-green-100 text-green-700 border-green-200";
    if (percent <= 40) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <ContentLock>
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos Finais</h1>
          <p className="text-muted-foreground mt-1">Seu cardápio de vendas. Defina o preço e controle o CMV.</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription>
                Ficha técnica para venda. Fique de olho no CMV!
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 pr-2">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Produto (Cardápio)</Label>
                    <Input 
                      placeholder="Ex: X-Salada Especial" 
                      value={nomeProduto}
                      onChange={e => setNomeProduto(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço de Venda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="pl-9 font-semibold text-lg"
                        placeholder="0,00"
                        value={precoVenda}
                        onChange={e => setPrecoVenda(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base text-primary font-semibold flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Composição do Produto
                    </Label>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border grid grid-cols-[1fr,auto,auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Adicionar Item</Label>
                      <Select value={itemSelecionadoId} onValueChange={setItemSelecionadoId}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Busque insumos ou receitas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {preparados.length > 0 && <SelectItem value="header-preparados" disabled className="font-bold opacity-100 text-primary">--- Receitas Prontas ---</SelectItem>}
                          {preparados.map(prep => (
                            <SelectItem key={prep.id} value={prep.id}>
                              🍽️ {prep.nome}
                            </SelectItem>
                          ))}

                          {insumos.length > 0 && <SelectItem value="header-insumos" disabled className="font-bold opacity-100 text-primary border-t mt-2 pt-2">--- Insumos ---</SelectItem>}
                          {insumos.map(insumo => (
                            <SelectItem key={insumo.id} value={insumo.id}>
                              📦 {insumo.nome} ({insumo.unidade_de_uso})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 w-32">
                      <Label className="text-xs text-muted-foreground">Qtd. na Receita</Label>
                      <Input 
                        type="number" 
                        step="0.001"
                        placeholder="0.00"
                        className="bg-background"
                        value={qtdItem}
                        onChange={e => setQtdItem(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={adicionarItem} variant="secondary">
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
                          <p>Adicione os ingredientes deste produto.</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {itensReceita.map((item) => (
                            <div key={item.id_temp} className="px-4 py-3 grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center hover:bg-muted/20 transition-colors">
                              <span className="text-sm font-medium flex items-center gap-2">
                                {item.tipo_item === 'preparado' ? '🍽️' : '📦'} {item.nome}
                              </span>
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
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Custo Total</span>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(custoTotal)}
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Lucro Líquido</span>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(lucroLiquido)}
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${getCmvStatus(cmv)}`}>
                  <span className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                    CMV (Meta 32%)
                  </span>
                  <div className="text-xl font-bold mt-1 flex items-center gap-1">
                    {cmv.toFixed(1)}%
                    {cmv <= 32 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>
              <Button type="submit" form="product-form" className="w-full" size="lg">
                {editingId ? "Atualizar Produto" : "Salvar Produto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start shadow-sm">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900 text-sm">Entenda o CMV (Custo da Mercadoria Vendida)</h3>
          <p className="text-sm text-blue-700 mt-1 leading-relaxed">
            O CMV indica quanto do seu preço de venda é consumido pelos ingredientes.
            Para ter um negócio saudável, sua <strong>meta deve ser de 32% ou menos</strong>.
            Se estiver vermelho, ajuste a receita ou o preço de venda.
          </p>
        </div>
      </div>

      {produtos.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Nenhum produto cadastrado</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Cadastre seus produtos finais para ver se você está tendo lucro ou prejuízo.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
                    Cadastrar Primeiro Produto
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {produtos.map((prod) => {
              const cmvProd = prod.preco_venda > 0 ? (prod.custo_total / prod.preco_venda) * 100 : 0;
              
              return (
                <Card key={prod.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleEdit(prod)}>
                    <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-lg line-clamp-1">{prod.nome}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                Venda: <span className="font-semibold text-foreground">{formatCurrency(prod.preco_venda)}</span>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(prod)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(prod.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-muted p-2 rounded text-center">
                            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Custo</span>
                            <span className="font-semibold text-sm">{formatCurrency(prod.custo_total)}</span>
                        </div>
                        <div className="bg-muted p-2 rounded text-center">
                            <span className="text-[10px] text-muted-foreground block uppercase font-bold">Lucro</span>
                            <span className="font-semibold text-sm">{formatCurrency(prod.preco_venda - prod.custo_total)}</span>
                        </div>
                        <div className={`p-2 rounded text-center border ${getCmvStatus(cmvProd)}`}>
                            <span className="text-[10px] opacity-80 block uppercase font-bold">CMV</span>
                            <span className="font-bold text-sm">{cmvProd.toFixed(1)}%</span>
                        </div>
                    </div>
                    </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
 </ContentLock>
  );
}