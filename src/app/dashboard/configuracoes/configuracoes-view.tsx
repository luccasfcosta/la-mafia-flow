"use client";

import { useState } from "react";
import { Save, Store, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  id: string;
  barbershop_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  opening_time: string;
  closing_time: string;
  working_days: number[];
  slot_duration_minutes: number;
}

interface StaffMember {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
}

interface ConfiguracoesViewProps {
  initialSettings: Settings | null;
  staff: StaffMember[];
}

const dayNames = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  barber: "Barbeiro",
  staff: "Funcionario",
};

export function ConfiguracoesView({
  initialSettings,
  staff,
}: ConfiguracoesViewProps) {
  const [settings, setSettings] = useState<Settings | null>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { error } = await supabase
        .from("settings")
        .update({
          barbershop_name: settings.barbershop_name,
          whatsapp: settings.whatsapp,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          postal_code: settings.postal_code,
          opening_time: settings.opening_time,
          closing_time: settings.closing_time,
          working_days: settings.working_days,
          slot_duration_minutes: settings.slot_duration_minutes,
        })
        .eq("id", settings.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Configuracoes salvas com sucesso");
      }
    } catch {
      toast.error("Erro ao salvar configuracoes");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    if (!settings) return;

    const newDays = settings.working_days.includes(day)
      ? settings.working_days.filter((d) => d !== day)
      : [...settings.working_days, day].sort();

    setSettings({ ...settings, working_days: newDays });
  };

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Erro ao carregar configuracoes
      </div>
    );
  }

  return (
    <Tabs defaultValue="geral" className="space-y-6">
      <TabsList>
        <TabsTrigger value="geral" className="gap-2">
          <Store className="h-4 w-4" />
          Geral
        </TabsTrigger>
        <TabsTrigger value="horarios" className="gap-2">
          <Clock className="h-4 w-4" />
          Horarios
        </TabsTrigger>
        <TabsTrigger value="equipe" className="gap-2">
          <Users className="h-4 w-4" />
          Equipe
        </TabsTrigger>
      </TabsList>

      {/* Geral */}
      <TabsContent value="geral">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Informacoes da Barbearia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Barbearia</Label>
                <Input
                  value={settings.barbershop_name}
                  onChange={(e) =>
                    setSettings({ ...settings, barbershop_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={settings.whatsapp || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsapp: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereco</Label>
              <Input
                value={settings.address || ""}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                placeholder="Rua, numero"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={settings.city || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={settings.state || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, state: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={settings.postal_code || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, postal_code: e.target.value })
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Horarios */}
      <TabsContent value="horarios">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Horario de Funcionamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Abertura</Label>
                <Input
                  type="time"
                  value={settings.opening_time}
                  onChange={(e) =>
                    setSettings({ ...settings, opening_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fechamento</Label>
                <Input
                  type="time"
                  value={settings.closing_time}
                  onChange={(e) =>
                    setSettings({ ...settings, closing_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duracao do Slot (min)</Label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={settings.slot_duration_minutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slot_duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dias de Funcionamento</Label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((name, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={
                      settings.working_days.includes(index)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleWorkingDay(index)}
                    className={
                      settings.working_days.includes(index)
                        ? "bg-gold hover:bg-gold/90 text-gold-foreground"
                        : ""
                    }
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gold hover:bg-gold/90 text-gold-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Equipe */}
      <TabsContent value="equipe">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Usuarios do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum usuario cadastrado
              </p>
            ) : (
              <div className="space-y-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {member.full_name || "Sem nome"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <Badge
                      className={
                        member.role === "admin"
                          ? "bg-gold/20 text-gold border-gold/30"
                          : ""
                      }
                    >
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

