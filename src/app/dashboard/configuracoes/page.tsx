import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracoesView } from "./configuracoes-view";

export const metadata: Metadata = {
  title: "Configuracoes | LA MAFIA 13",
  description: "Configuracoes da barbearia",
};

async function getData() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .single();

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "barber", "staff"])
    .eq("active", true)
    .order("full_name");

  return {
    settings: settings || null,
    staff: staff || [],
  };
}

export default async function ConfiguracoesPage() {
  const { settings, staff } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie as configuracoes da barbearia
        </p>
      </div>

      <ConfiguracoesView initialSettings={settings} staff={staff} />
    </div>
  );
}

