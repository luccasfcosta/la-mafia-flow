import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Painel | LA MAFIA 13",
  description: "Painel de controle",
};

type UpcomingAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  client: { name: string };
  barber: { name: string };
  service: { name: string };
};

async function getStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Get today's date range
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  // Get today's appointments
  const { count: todayAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay);

  // Get total clients
  const { count: totalClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Get active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get today's revenue (simplified - from paid payment_intents)
  const { data: todayPayments } = await supabase
    .from("payment_intents")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", startOfDay)
    .lte("paid_at", endOfDay);

  const todayRevenue =
    (todayPayments as { amount: number }[] | null)?.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0) || 0;

  // Get upcoming appointments
  const { data: upcomingAppointmentsResult } = await supabase
    .from("appointments")
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      client:clients(name),
      barber:barbers(name),
      service:services(name)
    `
    )
    .gte("start_time", new Date().toISOString())
    .lte("start_time", endOfDay)
    .in("status", ["scheduled", "confirmed"])
    .order("start_time", { ascending: true })
    .limit(5);

  const upcomingAppointments = (upcomingAppointmentsResult || []) as UpcomingAppointment[];

  return {
    todayAppointments: todayAppointments || 0,
    totalClients: totalClients || 0,
    activeSubscriptions: activeSubscriptions || 0,
    todayRevenue,
    upcomingAppointments,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Painel</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta. Aqui esta o resumo do dia.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agenda do Dia</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              agendamentos hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa do Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              receita de hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              assinaturas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" />
              Proximos Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum agendamento pendente para hoje.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {(appointment.client as { name: string })?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(appointment.service as { name: string })?.name} com{" "}
                        {(appointment.barber as { name: string })?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold">
                        {formatTime(appointment.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {appointment.status === "scheduled"
                          ? "Agendado"
                          : "Confirmado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              Acoes Rapidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <a
                href="/dashboard/agenda"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
              >
                <Calendar className="h-5 w-5 text-gold" />
                <div>
                  <p className="font-medium">Novo Agendamento</p>
                  <p className="text-sm text-muted-foreground">
                    Agendar um novo servico
                  </p>
                </div>
              </a>
              <a
                href="/dashboard/clientes"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
              >
                <Users className="h-5 w-5 text-gold" />
                <div>
                  <p className="font-medium">Cadastrar Cliente</p>
                  <p className="text-sm text-muted-foreground">
                    Adicionar novo cliente
                  </p>
                </div>
              </a>
              <a
                href="/dashboard/financeiro"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
              >
                <DollarSign className="h-5 w-5 text-gold" />
                <div>
                  <p className="font-medium">Ver Caixa</p>
                  <p className="text-sm text-muted-foreground">
                    Relatorio financeiro
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

