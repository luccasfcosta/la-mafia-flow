import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BarbersView } from "./barbers-view";

export const metadata: Metadata = {
  title: "Barbeiros | LA MAFIA 13",
  description: "Gerenciar equipe de barbeiros",
};

async function getData() {
  const supabase = await createClient();

  const { data: barbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("active", true)
    .order("name");

  return {
    barbers: barbers || [],
  };
}

export default async function BarbeirosPage() {
  const { barbers } = await getData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Barbeiros</h1>
        <p className="text-muted-foreground">
          Gerencie a equipe da barbearia
        </p>
      </div>

      <BarbersView initialBarbers={barbers} />
    </div>
  );
}

