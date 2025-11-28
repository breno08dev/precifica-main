import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calculator, Package, Scale, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Insumo } from "@/types/database";

const UNIDADES_COMPRA = [
  { value: "kg", label: "Quilograma (kg)", unit: "g", factor: 1000, type: "mass" },
  { value: "g", label: "Grama (g)", unit: "g", factor: 1, type: "mass" },
  { value: "l", label: "Litro (l)", unit: "ml", factor: 1000, type: "vol" },
  { value: "ml", label: "Mililitro (ml)", unit: "ml", factor: 1, type: "vol" },
  { value: "un", label: "Unidade (un)", unit: "un", factor: 1, type: "unit" },
  { value: "cx", label: "Caixa (cx)", unit: "un", factor: 1, type: "unit" }, 
  { value: "fd", label: "Fardo (fd)", unit: "un", factor: 1, type: "unit" }, 
];

const UNIDADES_USO = [
  { value: "kg", label: "Quilograma (kg)", factor: 1000, type: "mass" },
  { value: "g", label: "Grama (g)", factor: 1, type: "mass" },
  { value: "l", label: "Litro (l)", factor: 1000, type: "vol" },
  { value: "ml", label: "Mililitro (ml)", factor: 1, type: "vol" },
  { value: "un", label: "Unidade (un)", factor: 1, type: "unit" },
];

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    unidade_de_compra: "kg",
    quantidade_comprada: "",
    preco_compra: "",
    unidade_de_uso: "g",
    quantidade_por_porcao: "",
  });

  const [previaCusto, setPreviaCusto] = useState(0);
  const [incompativel, setIncompativel] = useState(false);

  useEffect(() => {
    fetchInsumos();
  }, []);

  useEffect(() => {
    const preco = parseFloat(formData.preco_compra) || 0;
    const qtdCompraInput = parseFloat(formData.quantidade_comprada) || 0;
    const qtdUsoInput = parseFloat(formData.quantidade_por_porcao) || 0;

    const unidadeCompraInfo = UNIDADES_COMPRA.find(u => u.value === formData.unidade_de_compra);
    const unidadeUsoInfo = UNIDADES_USO.find(u => u.value === formData.unidade_de_uso);

    if (!unidadeCompraInfo || !unidadeUsoInfo) return;

    const isIncompatible = unidadeCompraInfo.type !== unidadeUsoInfo.type;
    setIncompativel(isIncompatible);

    if (qtdCompraInput > 0 && qtdUsoInput > 0) {
      let qtdTotalBase = 0;
      let qtdUsoBase = 0;

      if (isIncompatible) {
        qtdTotalBase = qtdCompraInput; 
        qtdUsoBase = qtdUsoInput * unidadeUsoInfo.factor;
      } else {
        qtdTotalBase = qtdCompraInput * unidadeCompraInfo.factor;
        qtdUsoBase = qtdUsoInput * unidadeUsoInfo.factor;
      }

      const custoFinal = (preco / qtdTotalBase) * qtdUsoBase;
      setPreviaCusto(custoFinal);
    } else {
      setPreviaCusto(0);
    }
  }, [formData]);

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

    if (!formData.nome || !formData.preco_compra) {
        toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
        return;
    }

    const unidadeCompraInfo = UNIDADES_COMPRA.find(u => u.value === formData.unidade_de_compra);
    const unidadeUsoInfo = UNIDADES_USO.find(u => u.value === formData.unidade_de_uso);
    
    let unidadeBase = unidadeCompraInfo?.unit || "un";
    let qtdCompradaFinal = parseFloat(formData.quantidade_comprada) || 0;
    
    if (unidadeCompraInfo?.type !== unidadeUsoInfo?.type) {
        if (unidadeUsoInfo?.type === 'mass') unidadeBase = 'g';
        if (unidadeUsoInfo?.type === 'vol') unidadeBase = 'ml';
        qtdCompradaFinal = parseFloat(formData.quantidade_comprada) || 0;
    } else {
        qtdCompradaFinal = (parseFloat(formData.quantidade_comprada) || 0) * (unidadeCompraInfo?.factor || 1);
    }

    const qtdUsoFinal = (parseFloat(formData.quantidade_por_porcao) || 0) * (unidadeUsoInfo?.factor || 1);

    const payload = {
      nome: formData.nome,
      categoria: formData.categoria,
      preco_compra: parseFloat(formData.preco_compra),
      // user_id removido: O banco insere automaticamente via DEFAULT auth.uid()
      quantidade_comprada: qtdCompradaFinal,
      quantidade_por_porcao: qtdUsoFinal,
      unidade_de_compra: unidadeBase, 
      unidade_de_uso: unidadeBase 
    };

    const { error } = editingId
      ? await supabase.from("insumos").update(payload).eq("id", editingId)
      : await supabase.from("insumos").insert(payload);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: editingId ? "Atualizado!" : "Criado!",
        description: `Custo calculado: ${formatCurrency(previaCusto)}`
      });
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
    if (error) toast({ title: "Erro ao excluir", variant: "destructive" });
    else {
        toast({ title: "Insumo excluído!" });
        fetchInsumos();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      unidade_de_compra: "kg",
      quantidade_comprada: "",
      preco_compra: "",
      unidade_de_uso: "g",
      quantidade_por_porcao: "",
    });
    setEditingId(null);
    setPreviaCusto(0);
    setIncompativel(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Insumos</h1>
          <p className="text-muted-foreground mt-1">Cadastre seus ingredientes para o cálculo automático.</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingId ? "Editar Insumo" : "Cadastrar Novo Insumo"}</DialogTitle>
              <DialogDescription>
                O sistema converterá automaticamente as unidades para o cálculo de custo.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Ingrediente</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Alface, Tomate..."
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    placeholder="Ex: Verduras..."
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Como você compra?</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade da Embalagem</Label>
                    <Select 
                      value={formData.unidade_de_compra} 
                      onValueChange={(val) => setFormData({...formData, unidade_de_compra: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_COMPRA.map(u => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qtd_comprada" className={incompativel ? "text-orange-600 font-bold" : ""}>
                        {incompativel ? "Peso/Vol Total (g/ml)" : "Qtd. na Embalagem"}
                    </Label>
                    <Input
                      id="qtd_comprada"
                      type="number"
                      step="0.001"
                      placeholder={incompativel ? "Ex: 300 (para 300g)" : "Ex: 1 (para 1un)"}
                      value={formData.quantidade_comprada}
                      onChange={(e) => setFormData({ ...formData, quantidade_comprada: e.target.value })}
                      required
                      className={incompativel ? "border-orange-300 bg-orange-50 focus-visible:ring-orange-400" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço Pago (R$)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                        <Input
                        id="preco"
                        type="number"
                        step="0.01"
                        className="pl-9"
                        placeholder="0,00"
                        value={formData.preco_compra}
                        onChange={(e) => setFormData({ ...formData, preco_compra: e.target.value })}
                        required
                        />
                    </div>
                  </div>
                </div>
                
                {incompativel && (
                    <Alert variant="default" className="bg-orange-50 border-orange-200 text-orange-800 py-2">
                        <AlertTriangle className="h-4 w-4 stroke-orange-600" />
                        <AlertDescription className="text-xs ml-2">
                            Você comprou em <b>Unidade</b> mas usa em <b>Massa/Volume</b>. 
                            Informe o <b>peso total</b> (ex: 300g) no campo acima para calcularmos corretamente.
                        </AlertDescription>
                    </Alert>
                )}
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Como você usa na receita?</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade na Receita</Label>
                    <Select 
                      value={formData.unidade_de_uso} 
                      onValueChange={(val) => setFormData({...formData, unidade_de_uso: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_USO.map(u => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qtd_porcao">Quantidade Usada</Label>
                    <Input
                      id="qtd_porcao"
                      type="number"
                      step="0.001"
                      placeholder="Ex: 10 (para 10g)"
                      value={formData.quantidade_por_porcao}
                      onChange={(e) => setFormData({ ...formData, quantidade_por_porcao: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-background rounded-lg border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Calculator className="h-5 w-5" />
                        <div>
                          <span className="text-sm font-medium text-foreground">Custo desta Porção:</span>
                          <p className="text-xs">
                            Baseado em {formData.quantidade_por_porcao || 0} {formData.unidade_de_uso}
                          </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary block">
                            {formatCurrency(previaCusto)}
                        </span>
                    </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                {editingId ? "Salvar Alterações" : "Cadastrar Insumo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {insumos.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Nenhum insumo cadastrado</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Comece cadastrando os ingredientes que você compra.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
                    Cadastrar Insumo
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {insumos.map((insumo) => (
            <Card key={insumo.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
                <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold line-clamp-1" title={insumo.nome}>
                            {insumo.nome}
                        </CardTitle>
                        <Badge variant="secondary" className="font-normal text-xs">
                            {insumo.categoria || "Geral"}
                        </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(insumo)}>
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(insumo.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between items-end pt-2 border-t">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Custo Calculado</p>
                            <div className="text-xl font-bold text-primary">
                                {formatCurrency(insumo.custo_por_porcao || 0)}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">porção de</p>
                            <p className="font-medium text-sm">
                                {insumo.quantidade_por_porcao} {insumo.unidade_de_uso}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-muted p-2 rounded text-xs text-muted-foreground grid grid-cols-2 gap-2">
                        <div>
                            <span className="block opacity-70">Compra:</span>
                            <span className="font-medium">
                                {insumo.quantidade_comprada} {insumo.unidade_de_compra}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block opacity-70">Pago:</span>
                            <span className="font-medium">
                                {formatCurrency(insumo.preco_compra)}
                            </span>
                        </div>
                    </div>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}