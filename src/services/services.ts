"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getServices() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("services") as any)
    .select("*")
    .eq("active", true)
    .order("display_order");

  if (error) throw error;
  return data;
}

interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category?: string;
  allow_subscription: boolean;
}

export async function createServiceAction(input: CreateServiceInput) {
  const supabase = await createClient();

  // Get max display_order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("services") as any)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order || 0) + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("services") as any)
    .insert({
      name: input.name,
      description: input.description || null,
      price: input.price,
      duration_minutes: input.duration_minutes,
      category: input.category || null,
      allow_subscription: input.allow_subscription,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicos");
  return { data };
}

interface UpdateServiceInput extends Partial<CreateServiceInput> {
  id: string;
}

export async function updateServiceAction(input: UpdateServiceInput) {
  const supabase = await createClient();

  const { id, ...updateData } = input;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("services") as any)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicos");
  return { data };
}

export async function deleteServiceAction(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("services") as any)
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicos");
  return { success: true };
}
