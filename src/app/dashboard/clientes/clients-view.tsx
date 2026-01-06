"use client";

import { useState } from "react";
import { Search, Plus, Phone, Mail, Calendar, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { createClientAction, deleteClientAction } from "@/services/clients";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  birth_date: string | null;
  notes: string | null;
  total_visits: number;
  last_visit_at: string | null;
  preferred_barber: { id: string; name: string } | null;
}

interface Barber {
  id: string;
  name: string;
}

interface ClientsViewProps {
  initialClients: Client[];
  barbers: Barber[];
}

export function ClientsView({ initialClients, barbers }: ClientsViewProps) {
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    birth_date: "",
    notes: "",
    preferred_barber_id: "",
  });

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }

    const result = await createClientAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Cliente cadastrado com sucesso");
      setIsNewDialogOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        cpf: "",
        birth_date: "",
        notes: "",
        preferred_barber_id: "",
      });
      // Refresh data
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;

    const result = await deleteClientAction(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Cliente removido");
      setClients(clients.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
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

              <div className="space-y-2">
                <Label>Telefone *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, cpf: e.target.value }))
                    }
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, birth_date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Barbeiro Preferido</Label>
                <Select
                  value={formData.preferred_barber_id}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, preferred_barber_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Anotações sobre o cliente..."
                />
              </div>

              <Button
                onClick={handleCreate}
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                Cadastrar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        {filteredClients.length} cliente(s) encontrado(s)
      </div>

      {/* Clients Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Barbeiro Preferido</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Ultima Visita</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.cpf && (
                            <p className="text-xs text-muted-foreground">
                              {client.cpf}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.preferred_barber?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gold">
                        {client.total_visits}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.last_visit_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(client.last_visit_at), "dd/MM/yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedClient(client)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(client.id)}
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

      {/* Client Details Dialog */}
      <Dialog
        open={!!selectedClient}
        onOpenChange={() => setSelectedClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedClient.email || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CPF</p>
                  <p className="font-medium">{selectedClient.cpf || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">
                    {selectedClient.birth_date
                      ? format(
                          new Date(selectedClient.birth_date),
                          "dd/MM/yyyy"
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total de Visitas</p>
                  <p className="font-medium text-gold">
                    {selectedClient.total_visits}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Barbeiro Preferido</p>
                  <p className="font-medium">
                    {selectedClient.preferred_barber?.name || "-"}
                  </p>
                </div>
              </div>
              {selectedClient.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Observações</p>
                  <p className="mt-1">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

