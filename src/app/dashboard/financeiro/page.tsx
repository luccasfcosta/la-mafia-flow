import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { FinanceiroView } from "./financeiro-view";

export const metadata: Metadata = {
  title: "Financeiro | LA MAFIA 13",
  description: "Relatorios financeiros",
};

async function getData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

  // Current month revenue
  const { data: currentRevenue } = await supabase
    .from("payment_intents")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", monthStart)
    .lte("paid_at", monthEnd);

  const totalRevenue =
    (currentRevenue as { amount: number }[] | null)?.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0) || 0;

  // Last month revenue for comparison
  const { data: lastMonthRevenue } = await supabase
    .from("payment_intents")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", lastMonthStart)
    .lte("paid_at", lastMonthEnd);

  const lastMonthTotal =
    (lastMonthRevenue as { amount: number }[] | null)?.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0) || 0;

  // Current month commissions
  const { data: currentCommissions } = await supabase
    .from("commissions")
    .select("commission_amount")
    .in("status", ["approved", "paid"])
    .gte("created_at", monthStart)
    .lte("created_at", monthEnd);

  const totalCommissions =
    (currentCommissions as { commission_amount: number }[] | null)?.reduce((sum: number, c: { commission_amount: number }) => sum + Number(c.commission_amount), 0) || 0;

  // Recent ledger entries
  const { data: recentEntries } = await supabase
    .from("ledger_entries")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(20);

  // Active subscriptions count
  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Pending payments
  const { data: pendingPayments } = await supabase
    .from("payment_intents")
    .select("amount")
    .eq("status", "pending");

  const totalPending =
    (pendingPayments as { amount: number }[] | null)?.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0) || 0;

  const revenueGrowth =
    lastMonthTotal > 0 ? ((totalRevenue - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    totalRevenue,
    totalCommissions,
    netRevenue: totalRevenue - totalCommissions,
    revenueGrowth,
    activeSubscriptions: activeSubscriptions || 0,
    totalPending,
    recentEntries: recentEntries || [],
  };
}

export default async function FinanceiroPage() {
  const data = await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Caixa</h1>
        <p className="text-muted-foreground">
          Visao geral financeira do mes atual
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              {formatCurrency(data.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.revenueGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">
                    +{data.revenueGrowth.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">
                    {data.revenueGrowth.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissoes</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              pagamento aos barbeiros
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Liquido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(data.netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              receita menos comissoes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatCurrency(data.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              aguardando pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger */}
      <FinanceiroView recentEntries={data.recentEntries} />
    </div>
  );
}

