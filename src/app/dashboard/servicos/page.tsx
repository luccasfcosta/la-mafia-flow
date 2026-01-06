import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ServicesView } from "./services-view";

export const metadata: Metadata = {
  title: "Servicos | LA MAFIA 13",
  description: "Gerenciar catalogo de servicos",
};

async function getData() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("display_order");

  return {
    services: services || [],
  };
}

export default async function ServicosPage() {
  const { services } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Servicos</h1>
        <p className="text-muted-foreground">
          Gerencie o catalogo de servicos oferecidos
        </p>
      </div>

      <ServicesView initialServices={services} />
    </div>
  );
}

