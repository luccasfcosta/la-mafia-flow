import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CreditCard, Clock, User, LogOut } from "lucide-react";
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

  // Get client profile
  const { data: clientResult } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!clientResult) {
    // No client profile linked
    return { user, client: null, appointments: [], pastAppointments: [], subscription: null };
  }

  // Type assertion since we know clientResult exists
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
  const { data: appointmentsResult } = await supabase
    .from("appointments")
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
    .limit(5);

  const appointments = (appointmentsResult || []) as unknown as AppointmentWithRelations[];

  // Get past appointments
  const { data: pastAppointmentsResult } = await supabase
    .from("appointments")
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
    .limit(10);

  const pastAppointments = (pastAppointmentsResult || []) as unknown as AppointmentWithRelations[];

  // Get active subscription
  const { data: subscriptionResult } = await supabase
    .from("subscriptions")
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

  return {
    user,
    client: clientData,
    appointments,
    pastAppointments,
    subscription,
  };
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluido",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-500",
  confirmed: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
};

export default async function MinhaContaPage() {
  const { user, client, appointments, pastAppointments, subscription } =
    await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Minha Conta</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>

        {/* Profile */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gold" />
              Meus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Visitas</p>
                  <p className="font-medium text-gold">{client.total_visits}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Voce ainda nao tem um perfil de cliente vinculado. Faca um
                agendamento para criar seu perfil.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Subscription */}
        {subscription && (
          <Card className="bg-card border-border border-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gold" />
                Minha Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{subscription.plan_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.plan_description}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Proximo vencimento: </span>
                    {subscription.current_period_end &&
                      format(
                        new Date(subscription.current_period_end),
                        "dd/MM/yyyy"
                      )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold">
                    {formatCurrency(subscription.monthly_price)}
                  </p>
                  <p className="text-sm text-muted-foreground">/mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Appointments */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Proximos Agendamentos
            </CardTitle>
            <Button asChild size="sm" className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <a href="/agendar">Novo Agendamento</a>
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Voce nao tem agendamentos proximos
              </p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {(apt.service as { name: string })?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        com {(apt.barber as { name: string })?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {format(
                          new Date(apt.start_time),
                          "dd/MM 'as' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                      <Badge className={statusColors[apt.status]}>
                        {statusLabels[apt.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        {pastAppointments && pastAppointments.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Historico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {format(new Date(apt.start_time), "dd/MM/yy")}
                      </span>
                      <span>{(apt.service as { name: string })?.name}</span>
                    </div>
                    <span className="text-gold">
                      {formatCurrency(apt.price)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

