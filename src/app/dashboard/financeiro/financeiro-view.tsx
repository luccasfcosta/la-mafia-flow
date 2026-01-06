"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
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

interface LedgerEntry {
  id: string;
  kind: "credit" | "debit";
  category: string;
  amount: number;
  description: string | null;
  occurred_at: string;
}

interface FinanceiroViewProps {
  recentEntries: LedgerEntry[];
}

const categoryLabels: Record<string, string> = {
  service_payment: "Pagamento de Servico",
  subscription_payment: "Pagamento de Assinatura",
  refund: "Reembolso",
  commission: "Comissao",
  expense: "Despesa",
  adjustment: "Ajuste",
  withdrawal: "Saque",
};

export function FinanceiroView({ recentEntries }: FinanceiroViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Movimentacoes Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma movimentacao registrada
                </TableCell>
              </TableRow>
            ) : (
              recentEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {entry.kind === "credit" ? (
                      <div className="flex items-center gap-1 text-green-500">
                        <ArrowUpRight className="h-4 w-4" />
                        Entrada
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500">
                        <ArrowDownRight className="h-4 w-4" />
                        Saida
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoryLabels[entry.category] || entry.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {entry.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(entry.occurred_at),
                      "dd/MM/yyyy 'as' HH:mm",
                      { locale: ptBR }
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        entry.kind === "credit"
                          ? "text-green-500 font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {entry.kind === "credit" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

