import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "Agendar | LA MAFIA 13",
  description: "Agende seu horario",
};

async function getData() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, description")
    .eq("active", true)
    .order("display_order");

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id, name, bio, specialties, avatar_url")
    .eq("active", true)
    .order("name");

  const { data: settings } = await supabase
    .from("settings")
    .select("barbershop_name, whatsapp, address, city, opening_time, closing_time, working_days")
    .single();

  return {
    services: services || [],
    barbers: barbers || [],
    settings,
  };
}

export default async function AgendarPage() {
  const { services, barbers, settings } = await getData();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold mb-4">Agendar Horario</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o servico, barbeiro e horario de sua preferencia. 
          Voce recebera uma confirmacao por WhatsApp.
        </p>
      </div>

      {/* Booking Form */}
      <BookingForm services={services} barbers={barbers} settings={settings} />
    </div>
  );
}

