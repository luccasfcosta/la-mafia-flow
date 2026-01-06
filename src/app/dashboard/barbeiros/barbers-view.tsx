"use client";

import { useState } from "react";
import { Plus, Scissors, Percent, Phone, Mail } from "lucide-react";
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
import { toast } from "sonner";
import {
  createBarberAction,
  updateBarberAction,
  deleteBarberAction,
} from "@/services/barbers";

interface Barber {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  commission_percentage: number;
  specialties: string[] | null;
  avatar_url: string | null;
}

interface BarbersViewProps {
  initialBarbers: Barber[];
}

export function BarbersView({ initialBarbers }: BarbersViewProps) {
  const [barbers, setBarbers] = useState(initialBarbers);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    commission_percentage: 50,
    specialties: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      bio: "",
      commission_percentage: 50,
      specialties: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    const result = await createBarberAction({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      commission_percentage: formData.commission_percentage,
      specialties: formData.specialties
        ? formData.specialties.split(",").map((s) => s.trim())
        : undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Barbeiro cadastrado com sucesso");
      setIsNewDialogOpen(false);
      resetForm();
      window.location.reload();
    }
  };

  const handleUpdate = async () => {
    if (!editingBarber) return;

    const result = await updateBarberAction({
      id: editingBarber.id,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      commission_percentage: formData.commission_percentage,
      specialties: formData.specialties
        ? formData.specialties.split(",").map((s) => s.trim())
        : undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Barbeiro atualizado");
      setEditingBarber(null);
      resetForm();
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este barbeiro?")) return;

    const result = await deleteBarberAction(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Barbeiro removido");
      setBarbers(barbers.filter((b) => b.id !== id));
    }
  };

  const openEditDialog = (barber: Barber) => {
    setFormData({
      name: barber.name,
      email: barber.email || "",
      phone: barber.phone || "",
      bio: barber.bio || "",
      commission_percentage: barber.commission_percentage,
      specialties: barber.specialties?.join(", ") || "",
    });
    setEditingBarber(barber);
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Novo Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Barbeiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comissao (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      commission_percentage: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidades</Label>
                <Input
                  value={formData.specialties}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, specialties: e.target.value }))
                  }
                  placeholder="Barba, Degradê, Platinado (separar por vírgula)"
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Uma breve descrição do barbeiro..."
                />
              </div>

              <Button
                onClick={handleCreate}
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                Cadastrar Barbeiro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barbers Grid */}
      {barbers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum barbeiro cadastrado
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card key={barber.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{barber.name}</CardTitle>
                      <div className="flex items-center gap-1 text-gold">
                        <Percent className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {barber.commission_percentage}% comissão
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact */}
                <div className="space-y-2 text-sm">
                  {barber.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{barber.phone}</span>
                    </div>
                  )}
                  {barber.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{barber.email}</span>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                {barber.specialties && barber.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {barber.specialties.map((specialty, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-gold/30 text-gold"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {barber.bio && (
                  <p className="text-sm text-muted-foreground">{barber.bio}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEditDialog(barber)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(barber.id)}
                  >
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingBarber}
        onOpenChange={() => {
          setEditingBarber(null);
          resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Barbeiro</DialogTitle>
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
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comissao (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.commission_percentage}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    commission_percentage: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Especialidades</Label>
              <Input
                value={formData.specialties}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, specialties: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, bio: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={handleUpdate}
              className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

