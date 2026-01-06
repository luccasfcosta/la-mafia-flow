"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/schemas/client";

export async function getClients(search?: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("clients") as any)
    .select(
      `
      *,
      preferred_barber:barbers(id, name)
    `
    )
    .eq("active", true)
    .order("name");

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getClientById(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("clients") as any)
    .select(
      `
      *,
      preferred_barber:barbers(id, name)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getClientHistory(clientId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .select(
      `
      *,
      barber:barbers(id, name),
      service:services(id, name, price)
    `
    )
    .eq("client_id", clientId)
    .order("start_time", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function createClientAction(input: CreateClientInput): Promise<{ data?: { id: string }; error?: string }> {
  const validated = createClientSchema.parse(input);
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("clients") as any)
    .insert({
      name: validated.name,
      phone: validated.phone,
      email: validated.email || null,
      cpf: validated.cpf || null,
      birth_date: validated.birth_date || null,
      notes: validated.notes || null,
      preferred_barber_id: validated.preferred_barber_id || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { data };
}

export async function updateClientAction(input: UpdateClientInput) {
  const validated = updateClientSchema.parse(input);
  const supabase = await createClient();

  const { id, ...updateData } = validated;

  // Clean empty strings
  const cleanData = Object.fromEntries(
    Object.entries(updateData).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("clients") as any)
    .update(cleanData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { data };
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();

  // Soft delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("clients") as any)
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}
