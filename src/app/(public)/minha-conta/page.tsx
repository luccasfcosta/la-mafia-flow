import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  CreditCard,
  Clock,
  User,
  LogOut,
  ChevronDown,
  Scissors,
  Plus,
  History,
  Settings,
  KeyRound,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";

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

  // Get user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileResult } = await (supabase.from("profiles") as any)
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileResult as { full_name: string | null; avatar_url: string | null } | null;

  // Get client profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientResult } = await (supabase.from("clients") as any)
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!clientResult) {
    return {
      user,
      profile,
      client: null,
      appointments: [],
      pastAppointments: [],
      subscription: null,
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

  // Get active subscription
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptionResult } = await (supabase.from("subscriptions") as any)
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active")
    .single();

  const subscription = subscriptionResult as {
    id: string;
    plan_name: string;
    plan_description: string | null;
    monthly_price: number;
    current_period_end: string | null;
  } | null;

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
    profile,
    client: clientData,
    appointments,
    pastAppointments,
    subscription,
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
  const { user, profile, client, appointments, pastAppointments, subscription, payments } =
    await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const userName = profile?.full_name || client?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* User Header Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">Olá, {userName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/minha-conta/perfil" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Editar Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/minha-conta/senha" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Trocar Senha
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex items-center gap-2 w-full text-red-500">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="agendar" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-card border border-border">
            <TabsTrigger value="agendar" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plus className="h-4 w-4 hidden sm:block" />
              Agendar
            </TabsTrigger>
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

          {/* Tab: Agendar */}
          <TabsContent value="agendar" className="space-y-8">
            <div className="text-center py-12 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <Scissors className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold">Agende seu próximo corte</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Escolha o serviço, barbeiro e horário de sua preferência
                </p>
              </div>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                <Link href="/agendar">
                  <Plus className="mr-2 h-5 w-5" />
                  Novo Agendamento
                </Link>
              </Button>
            </div>

            {/* Active Subscription */}
            {subscription && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{subscription.plan_name}</p>
                      <p className="text-sm text-muted-foreground">{subscription.plan_description}</p>
                      {subscription.current_period_end && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Próximo vencimento:{" "}
                          {format(new Date(subscription.current_period_end), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(subscription.monthly_price)}
                    </p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {client && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{client.total_visits}</p>
                  <p className="text-sm text-muted-foreground">Visitas</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
                  <p className="text-sm text-muted-foreground">Agendados</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{pastAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {payments.filter((p) => p.status === "paid").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pagamentos</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Meus Cortes (Agendados) */}
          <TabsContent value="agendados" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-semibold">Próximos Agendamentos</h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/agendar">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Link>
              </Button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Nenhum agendamento</p>
                  <p className="text-sm text-muted-foreground">
                    Você não tem cortes agendados no momento
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/agendar">Agendar agora</Link>
                </Button>
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
          <TabsContent value="historico" className="space-y-6">
            <h2 className="text-xl font-serif font-semibold">Histórico de Cortes</h2>

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
          <TabsContent value="pagamentos" className="space-y-6">
            <h2 className="text-xl font-serif font-semibold">Histórico de Pagamentos</h2>

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
