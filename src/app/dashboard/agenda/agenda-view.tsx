"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getAppointments,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
} from "@/services/appointments";

interface Barber {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  notes: string | null;
  client: { id: string; name: string; phone: string };
  barber: { id: string; name: string };
  service: { id: string; name: string; price: number; duration_minutes: number };
}

interface AgendaViewProps {
  barbers: Barber[];
  services: Service[];
  clients: Client[];
  initialDate: string;
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  in_progress: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  completed: "bg-green-500/20 text-green-500 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/30",
  no_show: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

export function AgendaView({
  barbers,
  services,
  clients,
  initialDate,
}: AgendaViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    client_id: "",
    barber_id: "",
    service_id: "",
    time: "09:00",
    notes: "",
  });

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAppointments(selectedDate);
      setAppointments(data as Appointment[]);
    } catch {
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments =
    selectedBarber === "all"
      ? appointments
      : appointments.filter((a) => a.barber.id === selectedBarber);

  const handlePrevDay = () => {
    setSelectedDate(format(subDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    setSelectedDate(format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd"));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleCreateAppointment = async () => {
    if (
      !newAppointment.client_id ||
      !newAppointment.barber_id ||
      !newAppointment.service_id
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const startTime = new Date(`${selectedDate}T${newAppointment.time}:00`);

    const result = await createAppointment({
      client_id: newAppointment.client_id,
      barber_id: newAppointment.barber_id,
      service_id: newAppointment.service_id,
      start_time: startTime.toISOString(),
      notes: newAppointment.notes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Agendamento criado com sucesso");
      setIsNewDialogOpen(false);
      setNewAppointment({
        client_id: "",
        barber_id: "",
        service_id: "",
        time: "09:00",
        notes: "",
      });
      loadAppointments();
    }
  };

  const handleConfirm = async (id: string) => {
    const result = await confirmAppointment(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Agendamento confirmado");
      loadAppointments();
    }
  };

  const handleCancel = async (id: string) => {
    const result = await cancelAppointment({ id });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Agendamento cancelado");
      loadAppointments();
    }
  };

  const handleComplete = async (id: string) => {
    const result = await completeAppointment(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Atendimento finalizado");
      loadAppointments();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Barber Filter */}
        <Select value={selectedBarber} onValueChange={setSelectedBarber}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os barbeiros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New Appointment */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto bg-gold hover:bg-gold/90 text-gold-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={newAppointment.client_id}
                  onValueChange={(v) =>
                    setNewAppointment((p) => ({ ...p, client_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select
                  value={newAppointment.barber_id}
                  onValueChange={(v) =>
                    setNewAppointment((p) => ({ ...p, barber_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o barbeiro" />
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
                <Label>Servico</Label>
                <Select
                  value={newAppointment.service_id}
                  onValueChange={(v) =>
                    setNewAppointment((p) => ({ ...p, service_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)} (
                        {service.duration_minutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Horario</Label>
                <Input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) =>
                    setNewAppointment((p) => ({ ...p, time: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Observações opcionais..."
                />
              </div>

              <Button
                onClick={handleCreateAppointment}
                className="w-full bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                Criar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Display */}
      <div className="text-center">
        <h2 className="font-serif text-2xl font-bold">
          {format(new Date(selectedDate + "T12:00:00"), "EEEE", { locale: ptBR })}
        </h2>
        <p className="text-muted-foreground">
          {format(new Date(selectedDate + "T12:00:00"), "d 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </p>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando agendamentos...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum agendamento para este dia.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold">
                        {format(new Date(appointment.start_time), "HH:mm")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        até {format(new Date(appointment.end_time), "HH:mm")}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {appointment.client.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {appointment.client.phone}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.service.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Barbeiro:</span>
                    <span>{appointment.barber.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gold" />
                    <span className="text-gold font-medium">
                      {formatCurrency(appointment.price)}
                    </span>
                  </div>
                </div>

                {appointment.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {appointment.notes}
                  </p>
                )}

                {/* Actions */}
                {!["completed", "cancelled", "no_show"].includes(
                  appointment.status
                ) && (
                  <div className="flex gap-2 mt-4">
                    {appointment.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(appointment.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Confirmar
                      </Button>
                    )}
                    {["scheduled", "confirmed"].includes(appointment.status) && (
                      <Button
                        size="sm"
                        className="bg-gold hover:bg-gold/90 text-gold-foreground"
                        onClick={() => handleComplete(appointment.id)}
                      >
                        Finalizar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(appointment.id)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

