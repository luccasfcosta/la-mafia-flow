import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Calendar, Clock, MapPin, Phone } from "lucide-react";

type ServiceData = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
};

type BarberData = {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[] | null;
};

type SettingsData = {
  barbershop_name: string;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  opening_time: string;
  closing_time: string;
};

async function getData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: settingsResult } = await supabase
    .from("settings")
    .select("barbershop_name, whatsapp, address, city, opening_time, closing_time")
    .single();

  const settings = settingsResult as SettingsData | null;

  const { data: servicesResult } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, description")
    .eq("active", true)
    .order("display_order")
    .limit(6);

  const services = (servicesResult || []) as ServiceData[];

  const { data: barbersResult } = await supabase
    .from("barbers")
    .select("id, name, bio, specialties")
    .eq("active", true)
    .order("name")
    .limit(4);

  const barbers = (barbersResult || []) as BarberData[];

  return {
    settings,
    services,
    barbers,
  };
}

export default async function HomePage() {
  const { settings, services, barbers } = await getData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-6xl md:text-8xl font-bold mb-4">
            LA MAFIA
          </h1>
          <p className="text-gold text-3xl md:text-4xl font-serif mb-8">13</p>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Tradição, elegância e respeito. A barbearia que entende o homem moderno.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-gold-foreground text-lg px-8"
            >
              <Link href="/agendar">Agendar Horario</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold mb-4">Nossos Servicos</h2>
            <p className="text-muted-foreground">
              Qualidade e excelência em cada detalhe
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="bg-background border-border hover:border-gold/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-serif text-xl font-semibold">
                      {service.name}
                    </h3>
                    <span className="text-gold font-bold text-lg">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration_minutes} minutos</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/agendar">Ver Todos os Servicos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold mb-4">Nossa Equipe</h2>
            <p className="text-muted-foreground">
              Profissionais experientes e dedicados
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                className="bg-card border-border text-center"
              >
                <CardContent className="p-6">
                  <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                    <Scissors className="h-10 w-10 text-gold" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    {barber.name}
                  </h3>
                  {barber.bio && (
                    <p className="text-muted-foreground text-sm">
                      {barber.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Info Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl font-bold mb-8">
              Visite-nos
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {settings?.address && (
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-8 w-8 text-gold" />
                  <p className="font-medium">Endereco</p>
                  <p className="text-muted-foreground text-sm">
                    {settings.address}
                    {settings.city && `, ${settings.city}`}
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 text-gold" />
                <p className="font-medium">Horario</p>
                <p className="text-muted-foreground text-sm">
                  {settings?.opening_time || "09:00"} -{" "}
                  {settings?.closing_time || "20:00"}
                </p>
              </div>

              {settings?.whatsapp && (
                <div className="flex flex-col items-center gap-2">
                  <Phone className="h-8 w-8 text-gold" />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-muted-foreground text-sm">
                    {settings.whatsapp}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-12">
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold/90 text-gold-foreground"
              >
                <Link href="/agendar">
                  <Calendar className="mr-2 h-5 w-5" />
                  Agendar Agora
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold">LA MAFIA</span>
              <span className="font-serif text-gold text-lg">13</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestao para Barbearias
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
