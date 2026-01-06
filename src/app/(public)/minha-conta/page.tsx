import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  CreditCard,
  Clock,
  Scissors,
  History,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Minha Conta | LA MAFIA 13",
  description: "Gerencie sua conta",
};

async function getData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get client profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientResult } = await (supabase.from("clients") as any)
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!clientResult) {
    return {
      user,
      client: null,
      appointments: [],
      pastAppointments: [],
      payments: [],
    };
  }

  const clientData = clientResult as {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    total_visits: number;
  };
  const clientId = clientData.id;

  type AppointmentWithRelations = {
    id: string;
    start_time: string;
    status: string;
    price: number;
    barber: { name: string };
    service: { name: string; price: number };
  };

  // Get upcoming appointments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointmentsResult } = await (supabase.from("appointments") as any)
    .select(
      `
      id,
      start_time,
      status,
      price,
      barber:barbers(name),
      service:services(name, price)
    `
    )
    .eq("client_id", clientId)
    .gte("start_time", new Date().toISOString())
    .in("status", ["scheduled", "confirmed"])
    .order("start_time", { ascending: true })
    .limit(10);

  const appointments = (appointmentsResult || []) as unknown as AppointmentWithRelations[];

  // Get past appointments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pastAppointmentsResult } = await (supabase.from("appointments") as any)
    .select(
      `
      id,
      start_time,
      status,
      price,
      barber:barbers(name),
      service:services(name, price)
    `
    )
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("start_time", { ascending: false })
    .limit(20);

  const pastAppointments = (pastAppointmentsResult || []) as unknown as AppointmentWithRelations[];

  // Get payment history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paymentsResult } = await (supabase.from("payment_intents") as any)
    .select("id, amount, status, type, created_at, paid_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  type PaymentData = {
    id: string;
    amount: number;
    status: string;
    type: string;
    created_at: string;
    paid_at: string | null;
  };

  const payments = (paymentsResult || []) as PaymentData[];

  return {
    user,
    client: clientData,
    appointments,
    pastAppointments,
    payments,
  };
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-500",
  confirmed: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  processing: "bg-blue-500/20 text-blue-500",
  paid: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500",
  refunded: "bg-purple-500/20 text-purple-500",
  cancelled: "bg-gray-500/20 text-gray-500",
  expired: "bg-gray-500/20 text-gray-500",
};

export default async function MinhaContaPage() {
  const { appointments, pastAppointments, payments } = await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="agendados" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-card border border-border shrink-0">
            <TabsTrigger value="agendados" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4 hidden sm:block" />
              Meus Cortes
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4 hidden sm:block" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4 hidden sm:block" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Meus Cortes (Agendados) */}
          <TabsContent value="agendados" className="flex-1 overflow-auto mt-6">
            {appointments.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Nenhum agendamento</p>
                  <p className="text-sm text-muted-foreground">
                    Você não tem cortes agendados no momento
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{(apt.service as { name: string })?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          com {(apt.barber as { name: string })?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">
                        {format(new Date(apt.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="flex-1 overflow-auto mt-6">
            {pastAppointments.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Sem histórico</p>
                  <p className="text-sm text-muted-foreground">
                    Você ainda não realizou nenhum corte
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pastAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold">
                          {format(new Date(apt.start_time), "dd")}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(new Date(apt.start_time), "MMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{(apt.service as { name: string })?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(apt.barber as { name: string })?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(apt.price)}</p>
                      <Badge className={statusColors[apt.status]}>{statusLabels[apt.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Pagamentos */}
          <TabsContent value="pagamentos" className="flex-1 overflow-auto mt-6">
            {payments.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Sem pagamentos</p>
                  <p className="text-sm text-muted-foreground">
                    Você ainda não realizou nenhum pagamento
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {payment.type === "subscription" ? "Assinatura" : "Serviço"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <Badge className={paymentStatusColors[payment.status]}>
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
