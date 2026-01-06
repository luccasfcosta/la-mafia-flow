import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Users, DollarSign, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Assinaturas | LA MAFIA 13",
  description: "Gerenciar assinaturas de clientes",
};

type SubscriptionWithClient = {
  id: string;
  client_id: string;
  plan_name: string;
  plan_description: string | null;
  monthly_price: number;
  status: string;
  current_period_end: string | null;
  uses_this_month: number;
  max_uses_per_month: number | null;
  client: { id: string; name: string; phone: string; email: string | null };
};

async function getData() {
  const supabase = await createClient();

  const { data: subscriptionsResult } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      client_id,
      plan_name,
      plan_description,
      monthly_price,
      status,
      current_period_end,
      uses_this_month,
      max_uses_per_month,
      client:clients(id, name, phone, email)
    `
    )
    .order("created_at", { ascending: false });

  const subscriptions = (subscriptionsResult || []) as unknown as SubscriptionWithClient[];

  // Stats
  const active = subscriptions.filter((s) => s.status === "active").length;
  const paused = subscriptions.filter((s) => s.status === "paused").length;
  const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
  const pastDue = subscriptions.filter((s) => s.status === "past_due").length;

  const totalMRR = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.monthly_price), 0);

  return {
    subscriptions,
    stats: {
      active,
      paused,
      cancelled,
      pastDue,
      totalMRR,
    },
  };
}

const statusLabels: Record<string, string> = {
  active: "Ativa",
  paused: "Pausada",
  cancelled: "Cancelada",
  past_due: "Atrasada",
  expired: "Expirada",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-500 border-green-500/30",
  paused: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  cancelled: "bg-gray-500/20 text-gray-500 border-gray-500/30",
  past_due: "bg-red-500/20 text-red-500 border-red-500/30",
  expired: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

export default async function AssinaturasPage() {
  const { subscriptions, stats } = await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Assinaturas</h1>
        <p className="text-muted-foreground">
          Gerencie as assinaturas de clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              {formatCurrency(stats.totalMRR)}
            </div>
            <p className="text-xs text-muted-foreground">receita recorrente</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.paused}
            </div>
            <p className="text-xs text-muted-foreground">
              assinaturas pausadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.pastDue}
            </div>
            <p className="text-xs text-muted-foreground">pagamento pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proximo Vencimento</TableHead>
                <TableHead>Usos no Mes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma assinatura cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {(sub.client as { name: string })?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(sub.client as { phone: string })?.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.plan_name}</p>
                        {sub.plan_description && (
                          <p className="text-xs text-muted-foreground">
                            {sub.plan_description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gold">
                        {formatCurrency(sub.monthly_price)}/mes
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[sub.status]}>
                        {statusLabels[sub.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.current_period_end ? (
                        format(new Date(sub.current_period_end), "dd/MM/yyyy")
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.max_uses_per_month ? (
                        <span>
                          {sub.uses_this_month}/{sub.max_uses_per_month}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Ilimitado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

