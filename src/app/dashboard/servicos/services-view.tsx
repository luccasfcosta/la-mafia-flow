"use client";

import { useState } from "react";
import { Plus, Clock, DollarSign, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/services/services";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  allow_subscription: boolean;
  display_order: number;
}

interface ServicesViewProps {
  initialServices: Service[];
}

export function ServicesView({ initialServices }: ServicesViewProps) {
  const [services, setServices] = useState(initialServices);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_minutes: 30,
    category: "",
    allow_subscription: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      duration_minutes: 30,
      category: "",
      allow_subscription: false,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Nome e preco sao obrigatorios");
      return;
    }

    const result = await createServiceAction({
      name: formData.name,
      description: formData.description || undefined,
      price: formData.price,
      duration_minutes: formData.duration_minutes,
      category: formData.category || undefined,
      allow_subscription: formData.allow_subscription,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Servico cadastrado com sucesso");
      setIsNewDialogOpen(false);
      resetForm();
      window.location.reload();
    }
  };

  const handleUpdate = async () => {
    if (!editingService) return;

    const result = await updateServiceAction({
      id: editingService.id,
      name: formData.name,
      description: formData.description || undefined,
      price: formData.price,
      duration_minutes: formData.duration_minutes,
      category: formData.category || undefined,
      allow_subscription: formData.allow_subscription,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Servico atualizado");
      setEditingService(null);
      resetForm();
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este servico?")) return;

    const result = await deleteServiceAction(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Servico removido");
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const openEditDialog = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration_minutes: service.duration_minutes,
      category: service.category || "",
      allow_subscription: service.allow_subscription,
    });
    setEditingService(service);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Group by category
  const categories = [...new Set(services.map((s) => s.category || "Outros"))];

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Novo Servico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Servico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ex: Corte Classico"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preco (R$) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duracao (min)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        duration_minutes: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="Ex: Corte, Barba, Tratamento"
                />
              </div>

              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Descricao do servico..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_subscription"
                  checked={formData.allow_subscription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      allow_subscription: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="allow_subscription">
                  Disponivel para assinatura
                </Label>
              </div>

              <Button
                onClick={handleCreate}
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                Cadastrar Servico
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servico</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Duracao</TableHead>
                <TableHead>Preco</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum servico cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {service.category || "Outros"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {service.duration_minutes} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gold font-medium">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(service.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.allow_subscription ? (
                        <Badge className="bg-gold/20 text-gold border-gold/30">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(service)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(service.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingService}
        onOpenChange={() => {
          setEditingService(null);
          resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preco (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duracao (min)</Label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      duration_minutes: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_allow_subscription"
                checked={formData.allow_subscription}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    allow_subscription: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit_allow_subscription">
                Disponivel para assinatura
              </Label>
            </div>

            <Button
              onClick={handleUpdate}
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              Salvar Alteracoes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

