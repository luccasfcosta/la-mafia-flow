"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getBarbers() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("barbers") as any)
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getBarberById(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("barbers") as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getBarberCommissions(barberId: string, month?: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("commissions") as any)
    .select(
      `
      *,
      appointment:appointments(
        start_time,
        client:clients(name),
        service:services(name)
      )
    `
    )
    .eq("barber_id", barberId)
    .order("created_at", { ascending: false });

  if (month) {
    const startOfMonth = new Date(month + "-01");
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    query = query
      .gte("created_at", startOfMonth.toISOString())
      .lt("created_at", endOfMonth.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

interface CreateBarberInput {
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  commission_percentage: number;
  specialties?: string[];
}

export async function createBarberAction(input: CreateBarberInput) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("barbers") as any)
    .insert({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      bio: input.bio || null,
      commission_percentage: input.commission_percentage,
      specialties: input.specialties || [],
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/barbeiros");
  return { data };
}

interface UpdateBarberInput extends Partial<CreateBarberInput> {
  id: string;
}

export async function updateBarberAction(input: UpdateBarberInput) {
  const supabase = await createClient();

  const { id, ...updateData } = input;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("barbers") as any)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/barbeiros");
  return { data };
}

export async function deleteBarberAction(id: string) {
  const supabase = await createClient();

  // Soft delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("barbers") as any)
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/barbeiros");
  return { success: true };
}
