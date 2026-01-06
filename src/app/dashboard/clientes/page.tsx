import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClientsView } from "./clients-view";

export const metadata: Metadata = {
  title: "Clientes | LA MAFIA 13",
  description: "Gerenciar clientes",
};

async function getData() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      *,
      preferred_barber:barbers(id, name)
    `
    )
    .eq("active", true)
    .order("name");

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return {
    clients: clients || [],
    barbers: barbers || [],
  };
}

export default async function ClientesPage() {
  const { clients, barbers } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Clientes da Casa</h1>
        <p className="text-muted-foreground">
          Gerencie os clientes cadastrados
        </p>
      </div>

      <ClientsView initialClients={clients} barbers={barbers} />
    </div>
  );
}

