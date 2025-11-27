import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, TrendingUp, TrendingDown } from "lucide-react";
import type { ProdutoFinal, Insumo, ProdutoPreparado } from "@/types/database";

type ItemProduto = {
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  quantidade_usada: number;
  custo: number;
  nome?: string;
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<ProdutoFinal[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [preparados, setPreparados] = useState<ProdutoPreparado[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    preco_venda: "",
  });

  const [itens, setItens] = useState<ItemProduto[]>([]);
  const [currentItem, setCurrentItem] = useState({
    item_id: "",
    tipo_item: "insumo" as 'insumo' | 'preparado',
    quantidade_usada: "",
  });

  useEffect(() => {
    fetchProdutos();
    fetchInsumos();
    fetchPreparados();
  }, []);

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos_finais")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar produtos", variant: "destructive" });
    } else {
      setProdutos(data || []);
    }
  };

  const fetchInsumos = async () => {
    const { data } = await supabase.from("insumos").select("*").order("nome");
    setInsumos(data || []);
  };

  const fetchPreparados = async () => {
    const { data } = await supabase.from("produtos_preparados").select("*").order("nome");
    setPreparados(data || []);
  };

  const addItem = () => {
    if (!currentItem.item_id || !currentItem.quantidade_usada) {
      toast({ title: "Preencha todos os campos do item", variant: "destructive" });
      return;
    }

    let custoItem = 0;
    let nomeItem = "";

    if (currentItem.tipo_item === "insumo") {
      const insumo = insumos.find(i => i.id === currentItem.item_id);
      if (!insumo) return;
      custoItem = (insumo.custo_por_porcao || 0) * parseFloat(currentItem.quantidade_usada);
      nomeItem = insumo.nome;
    } else {
      const preparado = preparados.find(p => p.id === currentItem.item_id);
      if (!preparado) return;
      custoItem = (preparado.custo_por_unidade || 0) * parseFloat(currentItem.quantidade_usada);
      nomeItem = preparado.nome;
    }

    setItens([
      ...itens,
      {
        ...currentItem,
        quantidade_usada: parseFloat(currentItem.quantidade_usada),
        custo: custoItem,
        nome: nomeItem,
      },
    ]);

    setCurrentItem({
      item_id: "",
      tipo_item: "insumo",
      quantidade_usada: "",
    });
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (itens.length === 0) {
      toast({ title: "Adicione ao menos um item", variant: "destructive" });
      return;
    }

    const custoTotal = itens.reduce((acc, item) => acc + item.custo, 0);

    const produtoPayload = {
      nome: formData.nome,
      preco_venda: parseFloat(formData.preco_venda),
      custo_total: custoTotal,
      user_id: session.user.id,
    };

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

      const itensPayload = itens.map(item => ({
        produto_id: editingId,
        user_id: session.user.id,
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade_usada,
        custo: item.custo,
      }));

      const { error: itensError } = await supabase
        .from("produtos_finais_itens")
        .insert(itensPayload);

      if (itensError) {
        toast({ title: "Erro ao salvar itens", variant: "destructive" });
        return;
      }

      toast({ title: "Produto atualizado!" });
    } else {
      const { data: produtoData, error } = await supabase
        .from("produtos_finais")
        .insert(produtoPayload)
        .select()
        .single();

      if (error || !produtoData) {
        toast({ title: "Erro ao criar produto", variant: "destructive" });
        return;
      }

      const itensPayload = itens.map(item => ({
        produto_id: produtoData.id,
        user_id: session.user.id,
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade_usada,
        custo: item.custo,
      }));

      const { error: itensError } = await supabase
        .from("produtos_finais_itens")
        .insert(itensPayload);

      if (itensError) {
        toast({ title: "Erro ao salvar itens", variant: "destructive" });
        return;
      }

      toast({ title: "Produto criado!" });
    }

    setOpen(false);
    resetForm();
    fetchProdutos();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("produtos_finais")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Produto excluído!" });
      fetchProdutos();
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", preco_venda: "" });
    setItens([]);
    setCurrentItem({ item_id: "", tipo_item: "insumo", quantidade_usada: "" });
    setEditingId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos Finais</h1>
          <p className="text-muted-foreground mt-1">Itens do cardápio para venda</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço de Venda (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <Label>Adicionar Ingredientes</Label>
                <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2">
                  <Select
                    value={currentItem.tipo_item}
                    onValueChange={(value) => setCurrentItem({ ...currentItem, tipo_item: value as 'insumo' | 'preparado', item_id: "" })}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insumo">Insumo</SelectItem>
                      <SelectItem value="preparado">Preparado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={currentItem.item_id}
                    onValueChange={(value) => setCurrentItem({ ...currentItem, item_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentItem.tipo_item === "insumo" 
                        ? insumos.map((insumo) => (
                            <SelectItem key={insumo.id} value={insumo.id}>
                              {insumo.nome} - {formatCurrency(insumo.custo_por_porcao || 0)}/porção
                            </SelectItem>
                          ))
                        : preparados.map((prep) => (
                            <SelectItem key={prep.id} value={prep.id}>
                              {prep.nome} - {formatCurrency(prep.custo_por_unidade || 0)}/un
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Quantidade"
                    value={currentItem.quantidade_usada}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantidade_usada: e.target.value })}
                  />
                  <Button type="button" onClick={addItem} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {itens.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {itens.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">
                          {item.nome} x {item.quantidade_usada} = {formatCurrency(item.custo)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Custo Total:</span>
                        <span className="text-primary">
                          {formatCurrency(itens.reduce((acc, item) => acc + item.custo, 0))}
                        </span>
                      </div>
                      {formData.preco_venda && (
                        <div className="flex justify-between text-sm">
                          <span>Margem de Lucro:</span>
                          <span className="text-success font-medium">
                            {((parseFloat(formData.preco_venda) - itens.reduce((acc, item) => acc + item.custo, 0)) / itens.reduce((acc, item) => acc + item.custo, 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"} Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {produtos.map((produto) => (
          <Card key={produto.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{produto.nome}</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(produto.preco_venda)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(produto.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo:</span>
                <span className="font-semibold">
                  {formatCurrency(produto.custo_total)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Margem:</span>
                <div className="flex items-center gap-1">
                  {(produto.margem_lucro || 0) >= 30 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={`font-semibold ${(produto.margem_lucro || 0) >= 30 ? 'text-success' : 'text-destructive'}`}>
                    {(produto.margem_lucro || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro:</span>
                <span className="font-semibold text-success">
                  {formatCurrency(produto.preco_venda - produto.custo_total)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
