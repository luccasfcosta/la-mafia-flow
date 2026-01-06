"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, DollarSign, User, Scissors, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAvailableSlots, createAppointment } from "@/services/appointments";
import { createClientAction } from "@/services/clients";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
}

interface Barber {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[] | null;
  avatar_url: string | null;
}

interface Settings {
  barbershop_name: string;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  opening_time: string;
  closing_time: string;
  working_days: number[];
}

interface BookingFormProps {
  services: Service[];
  barbers: Barber[];
  settings: Settings | null;
}

type Step = "service" | "barber" | "datetime" | "info" | "confirm";

export function BookingForm({ services, barbers, settings }: BookingFormProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep("barber");
  };

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep("datetime");
  };

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setIsLoadingSlots(true);

    try {
      const slots = await getAvailableSlots(
        selectedBarber!.id,
        date,
        selectedService!.duration_minutes
      );
      setAvailableSlots(slots);
    } catch {
      toast.error("Erro ao carregar horarios disponiveis");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSelectSlot = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setStep("info");
  };

  const handleSubmit = async () => {
    if (!clientInfo.name || !clientInfo.phone) {
      toast.error("Nome e telefone sao obrigatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create or find client
      const clientResult = await createClientAction({
        name: clientInfo.name,
        phone: clientInfo.phone,
        email: clientInfo.email || undefined,
      });

      if (clientResult.error) {
        toast.error(clientResult.error);
        return;
      }

      // Create appointment
      const appointmentResult = await createAppointment({
        client_id: clientResult.data!.id,
        barber_id: selectedBarber!.id,
        service_id: selectedService!.id,
        start_time: selectedSlot!.start,
      });

      if (appointmentResult.error) {
        toast.error(appointmentResult.error);
        return;
      }

      setStep("confirm");
      toast.success("Agendamento realizado com sucesso!");
    } catch {
      toast.error("Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    const dayOfWeek = date.getDay();

    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE, d 'de' MMM", { locale: ptBR }),
      isWorkingDay: settings?.working_days.includes(dayOfWeek) ?? true,
    };
  }).filter((d) => d.isWorkingDay);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["service", "barber", "datetime", "info", "confirm"] as Step[]).map(
          (s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s || (["service", "barber", "datetime", "info", "confirm"].indexOf(step) > i)
                    ? "bg-gold text-gold-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    ["service", "barber", "datetime", "info", "confirm"].indexOf(step) > i
                      ? "bg-gold"
                      : "bg-secondary"
                  }`}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Step 1: Service Selection */}
      {step === "service" && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-center mb-6">
            Escolha o Servico
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card
                key={service.id}
                className="bg-card border-border cursor-pointer hover:border-gold transition-colors"
                onClick={() => handleSelectService(service)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {service.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <span className="text-gold font-bold">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Barber Selection */}
      {step === "barber" && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-center mb-6">
            Escolha o Barbeiro
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                className="bg-card border-border cursor-pointer hover:border-gold transition-colors"
                onClick={() => handleSelectBarber(barber)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                    <Scissors className="h-8 w-8 text-gold" />
                  </div>
                  <h3 className="font-medium">{barber.name}</h3>
                  {barber.specialties && barber.specialties.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {barber.specialties.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => setStep("service")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Date & Time Selection */}
      {step === "datetime" && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-center mb-6">
            Escolha Data e Horario
          </h2>

          {/* Date Selection */}
          <div>
            <Label className="mb-2 block">Data</Label>
            <div className="flex flex-wrap gap-2">
              {availableDates.map((d) => (
                <Button
                  key={d.date}
                  variant={selectedDate === d.date ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectDate(d.date)}
                  className={
                    selectedDate === d.date
                      ? "bg-gold hover:bg-gold/90 text-gold-foreground"
                      : ""
                  }
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <Label className="mb-2 block">Horario</Label>
              {isLoadingSlots ? (
                <p className="text-muted-foreground">Carregando horarios...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhum horario disponivel para esta data
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.start}
                      variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectSlot(slot)}
                      className={
                        selectedSlot?.start === slot.start
                          ? "bg-gold hover:bg-gold/90 text-gold-foreground"
                          : ""
                      }
                    >
                      {format(new Date(slot.start), "HH:mm")}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setStep("barber")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Client Info */}
      {step === "info" && (
        <div className="space-y-6 max-w-md mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center mb-6">
            Seus Dados
          </h2>

          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={clientInfo.name}
                  onChange={(e) =>
                    setClientInfo((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone (WhatsApp) *</Label>
                <Input
                  value={clientInfo.phone}
                  onChange={(e) =>
                    setClientInfo((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) =>
                    setClientInfo((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="seu@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servico:</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barbeiro:</span>
                <span>{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span>
                  {selectedSlot &&
                    format(new Date(selectedSlot.start), "dd/MM/yyyy 'as' HH:mm", {
                      locale: ptBR,
                    })}
                </span>
              </div>
              <div className="flex justify-between font-medium text-gold pt-2 border-t border-border">
                <span>Valor:</span>
                <span>{formatCurrency(selectedService?.price || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setStep("datetime")}>
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === "confirm" && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold">
            Agendamento Confirmado!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seu agendamento foi realizado com sucesso. Voce recebera uma
            confirmacao por WhatsApp em breve.
          </p>

          <Card className="bg-card border-border max-w-md mx-auto">
            <CardContent className="p-6 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gold" />
                <span>
                  {selectedSlot &&
                    format(
                      new Date(selectedSlot.start),
                      "EEEE, d 'de' MMMM 'as' HH:mm",
                      { locale: ptBR }
                    )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-gold" />
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gold" />
                <span>{selectedBarber?.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gold" />
                <span className="text-gold font-medium">
                  {formatCurrency(selectedService?.price || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
            <a href="/agendar">Fazer Novo Agendamento</a>
          </Button>
        </div>
      )}
    </div>
  );
}

