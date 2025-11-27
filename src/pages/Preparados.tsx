import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import type { ProdutoPreparado, Insumo } from "@/types/database";

type ItemPreparado = {
  item_id: string;
  tipo_item: 'insumo' | 'preparado';
  quantidade_usada: number;
  custo: number;
  nome?: string;
};

export default function Preparados() {
  const [preparados, setPreparados] = useState<ProdutoPreparado[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    rendimento_total: "",
  });

  const [itens, setItens] = useState<ItemPreparado[]>([]);
  const [currentItem, setCurrentItem] = useState({
    item_id: "",
    tipo_item: "insumo" as 'insumo' | 'preparado',
    quantidade_usada: "",
  });

  useEffect(() => {
    fetchPreparados();
    fetchInsumos();
  }, []);

  const fetchPreparados = async () => {
    const { data, error } = await supabase
      .from("produtos_preparados")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar preparados", variant: "destructive" });
    } else {
      setPreparados(data || []);
    }
  };

  const fetchInsumos = async () => {
    const { data } = await supabase
      .from("insumos")
      .select("*")
      .order("nome");
    setInsumos(data || []);
  };

  const addItem = () => {
    if (!currentItem.item_id || !currentItem.quantidade_usada) {
      toast({ title: "Preencha todos os campos do item", variant: "destructive" });
      return;
    }

    const insumoSelecionado = insumos.find(i => i.id === currentItem.item_id);
    if (!insumoSelecionado) return;

    const custoItem = (insumoSelecionado.custo_por_porcao || 0) * parseFloat(currentItem.quantidade_usada);

    setItens([
      ...itens,
      {
        ...currentItem,
        quantidade_usada: parseFloat(currentItem.quantidade_usada),
        custo: custoItem,
        nome: insumoSelecionado.nome,
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

    const preparadoPayload = {
      nome: formData.nome,
      rendimento_total: parseFloat(formData.rendimento_total),
      custo_total: custoTotal,
      user_id: session.user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from("produtos_preparados")
        .update(preparadoPayload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        return;
      }

      await supabase.from("produtos_preparados_itens").delete().eq("preparado_id", editingId);

      const itensPayload = itens.map(item => ({
        preparado_id: editingId,
        user_id: session.user.id,
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade_usada,
        custo: item.custo,
      }));

      const { error: itensError } = await supabase
        .from("produtos_preparados_itens")
        .insert(itensPayload);

      if (itensError) {
        toast({ title: "Erro ao salvar itens", variant: "destructive" });
        return;
      }

      toast({ title: "Preparado atualizado!" });
    } else {
      const { data: preparadoData, error } = await supabase
        .from("produtos_preparados")
        .insert(preparadoPayload)
        .select()
        .single();

      if (error || !preparadoData) {
        toast({ title: "Erro ao criar preparado", variant: "destructive" });
        return;
      }

      const itensPayload = itens.map(item => ({
        preparado_id: preparadoData.id,
        user_id: session.user.id,
        item_id: item.item_id,
        tipo_item: item.tipo_item,
        quantidade_usada: item.quantidade_usada,
        custo: item.custo,
      }));

      const { error: itensError } = await supabase
        .from("produtos_preparados_itens")
        .insert(itensPayload);

      if (itensError) {
        toast({ title: "Erro ao salvar itens", variant: "destructive" });
        return;
      }

      toast({ title: "Preparado criado!" });
    }

    setOpen(false);
    resetForm();
    fetchPreparados();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("produtos_preparados")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Preparado excluído!" });
      fetchPreparados();
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", rendimento_total: "" });
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
          <h1 className="text-3xl font-bold">Produtos Preparados</h1>
          <p className="text-muted-foreground mt-1">Receitas internas do seu negócio</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Preparado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Preparado" : "Novo Preparado"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Preparado</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rendimento">Rendimento Total (g ou ml)</Label>
                  <Input
                    id="rendimento"
                    type="number"
                    step="0.01"
                    value={formData.rendimento_total}
                    onChange={(e) => setFormData({ ...formData, rendimento_total: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <Label>Adicionar Ingredientes</Label>
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <Select
                    value={currentItem.item_id}
                    onValueChange={(value) => setCurrentItem({ ...currentItem, item_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={insumo.id}>
                          {insumo.nome} - {formatCurrency(insumo.custo_por_porcao || 0)}/porção
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Quantidade de porções"
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
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Custo Total:</span>
                      <span className="text-primary">
                        {formatCurrency(itens.reduce((acc, item) => acc + item.custo, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"} Preparado
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {preparados.map((preparado) => (
          <Card key={preparado.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{preparado.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    Rendimento: {preparado.rendimento_total}g/ml
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(preparado.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Total:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(preparado.custo_total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo por Unidade:</span>
                <span className="font-semibold">
                  {formatCurrency(preparado.custo_por_unidade || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
