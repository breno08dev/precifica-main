import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Insumo } from "@/types/database";

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    unidade_de_compra: "",
    quantidade_comprada: "",
    preco_compra: "",
    unidade_de_uso: "",
    quantidade_por_porcao: "",
  });

  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    const { data, error } = await supabase
      .from("insumos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar insumos", variant: "destructive" });
    } else {
      setInsumos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      ...formData,
      user_id: session.user.id,
      quantidade_comprada: parseFloat(formData.quantidade_comprada),
      preco_compra: parseFloat(formData.preco_compra),
      quantidade_por_porcao: parseFloat(formData.quantidade_por_porcao),
    };

    const { error } = editingId
      ? await supabase.from("insumos").update(payload).eq("id", editingId)
      : await supabase.from("insumos").insert(payload);

    if (error) {
      toast({ title: "Erro ao salvar insumo", variant: "destructive" });
    } else {
      toast({ title: editingId ? "Insumo atualizado!" : "Insumo criado!" });
      setOpen(false);
      resetForm();
      fetchInsumos();
    }
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingId(insumo.id);
    setFormData({
      nome: insumo.nome,
      categoria: insumo.categoria,
      unidade_de_compra: insumo.unidade_de_compra,
      quantidade_comprada: insumo.quantidade_comprada.toString(),
      preco_compra: insumo.preco_compra.toString(),
      unidade_de_uso: insumo.unidade_de_uso,
      quantidade_por_porcao: insumo.quantidade_por_porcao.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("insumos").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir insumo", variant: "destructive" });
    } else {
      toast({ title: "Insumo excluído!" });
      fetchInsumos();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      unidade_de_compra: "",
      quantidade_comprada: "",
      preco_compra: "",
      unidade_de_uso: "",
      quantidade_por_porcao: "",
    });
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
          <h1 className="text-3xl font-bold">Insumos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus ingredientes</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Insumo" : "Novo Insumo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_compra">Unidade de Compra</Label>
                  <Input
                    id="unidade_compra"
                    placeholder="kg, litro, unidade"
                    value={formData.unidade_de_compra}
                    onChange={(e) => setFormData({ ...formData, unidade_de_compra: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qtd_comprada">Qtd Comprada</Label>
                  <Input
                    id="qtd_comprada"
                    type="number"
                    step="0.001"
                    value={formData.quantidade_comprada}
                    onChange={(e) => setFormData({ ...formData, quantidade_comprada: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço Compra (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco_compra}
                    onChange={(e) => setFormData({ ...formData, preco_compra: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_uso">Unidade de Uso</Label>
                  <Input
                    id="unidade_uso"
                    placeholder="g, ml, unidade"
                    value={formData.unidade_de_uso}
                    onChange={(e) => setFormData({ ...formData, unidade_de_uso: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="qtd_porcao">Qtd por Porção</Label>
                  <Input
                    id="qtd_porcao"
                    type="number"
                    step="0.001"
                    value={formData.quantidade_por_porcao}
                    onChange={(e) => setFormData({ ...formData, quantidade_por_porcao: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insumos.map((insumo) => (
          <Card key={insumo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{insumo.nome}</div>
                  <div className="text-sm text-muted-foreground">{insumo.categoria}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(insumo)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(insumo.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo por porção:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(insumo.custo_por_porcao || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Porção: {insumo.quantidade_por_porcao} {insumo.unidade_de_uso}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
