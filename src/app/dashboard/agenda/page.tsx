import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaView } from "./agenda-view";

export const metadata: Metadata = {
  title: "Agenda | LA MAFIA 13",
  description: "Gerenciar agendamentos",
};

async function getData() {
  const supabase = await createClient();

  // Get barbers for filter
  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("active", true)
    .order("name");

  // Get services for new appointment
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("active", true)
    .order("display_order");

  // Get clients for new appointment
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone")
    .eq("active", true)
    .order("name")
    .limit(100);

  return {
    barbers: barbers || [],
    services: services || [],
    clients: clients || [],
  };
}

export default async function AgendaPage() {
  const { barbers, services, clients } = await getData();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Agenda View */}
      <AgendaView
        barbers={barbers}
        services={services}
        clients={clients}
        initialDate={today}
      />
    </div>
  );
}

