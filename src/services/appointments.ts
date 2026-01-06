"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  cancelAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
  type CancelAppointmentInput,
} from "@/schemas/appointment";
import { addMinutes } from "date-fns";
import type { Database, AppointmentStatus } from "@/lib/supabase/database.types";

type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];

interface ServiceData {
  price: number;
  duration_minutes: number;
}

interface SettingsData {
  opening_time: string;
  closing_time: string;
  slot_duration_minutes: number;
  working_days: number[];
}

interface AppointmentSlot {
  start_time: string;
  end_time: string;
}

export async function getAppointments(date?: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("appointments") as any)
    .select(
      `
      *,
      client:clients(id, name, phone),
      barber:barbers(id, name),
      service:services(id, name, price, duration_minutes)
    `
    )
    .order("start_time", { ascending: true });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getAppointmentById(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .select(
      `
      *,
      client:clients(*),
      barber:barbers(*),
      service:services(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAppointment(input: CreateAppointmentInput) {
  const validated = createAppointmentSchema.parse(input);
  const supabase = await createClient();

  // Get service duration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: serviceData } = await (supabase.from("services") as any)
    .select("price, duration_minutes")
    .eq("id", validated.service_id)
    .single();

  const service = serviceData as ServiceData | null;

  if (!service) {
    return { error: "Serviço não encontrado" };
  }

  // Calculate end time
  const startTime = new Date(validated.start_time);
  const endTime = addMinutes(startTime, service.duration_minutes);

  // Check availability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conflicting } = await (supabase.from("appointments") as any)
    .select("id")
    .eq("barber_id", validated.barber_id)
    .not("status", "in", '("cancelled","no_show")')
    .or(
      `and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`
    )
    .limit(1);

  if (conflicting && conflicting.length > 0) {
    return { error: "Horário indisponível para este barbeiro" };
  }

  const appointmentData = {
    client_id: validated.client_id,
    barber_id: validated.barber_id,
    service_id: validated.service_id,
    start_time: validated.start_time,
    end_time: endTime.toISOString(),
    price: service.price,
    notes: validated.notes,
    status: "scheduled" as const,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .insert(appointmentData)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/agenda");
  return { data };
}

export async function updateAppointment(input: UpdateAppointmentInput) {
  const validated = updateAppointmentSchema.parse(input);
  const supabase = await createClient();

  const { id, ...updateData } = validated;

  // If changing service or start_time, recalculate end_time
  if (updateData.service_id || updateData.start_time) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (supabase.from("appointments") as any)
      .select("service_id, start_time")
      .eq("id", id)
      .single();

    const serviceId = updateData.service_id || current?.service_id;
    const startTimeStr = updateData.start_time || current?.start_time;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: serviceUpdateData } = await (supabase.from("services") as any)
      .select("duration_minutes, price")
      .eq("id", serviceId)
      .single();

    const serviceUpdate = serviceUpdateData as ServiceData | null;

    if (serviceUpdate && startTimeStr) {
      const startTime = new Date(startTimeStr);
      const endTime = addMinutes(startTime, serviceUpdate.duration_minutes);
      Object.assign(updateData, {
        end_time: endTime.toISOString(),
        price: serviceUpdate.price,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/agenda");
  return { data };
}

export async function cancelAppointment(input: CancelAppointmentInput) {
  const validated = cancelAppointmentSchema.parse(input);
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_reason: validated.cancelled_reason,
    })
    .eq("id", validated.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/agenda");
  return { data };
}

export async function confirmAppointment(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .update({ status: "confirmed" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/agenda");
  return { data };
}

export async function completeAppointment(id: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("appointments") as any)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/agenda");
  return { data };
}

export async function getAvailableSlots(
  barberId: string,
  date: string,
  durationMinutes: number = 30
) {
  const supabase = await createClient();

  // Get settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settingsData } = await (supabase.from("settings") as any)
    .select("opening_time, closing_time, slot_duration_minutes, working_days")
    .single();

  const settings = settingsData as SettingsData | null;

  if (!settings) {
    return [];
  }

  const dayOfWeek = new Date(date).getDay();
  if (!settings.working_days.includes(dayOfWeek)) {
    return []; // Not a working day
  }

  // Get existing appointments for this barber on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointments } = await (supabase.from("appointments") as any)
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .not("status", "in", '("cancelled","no_show")')
    .gte("start_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString());

  // Generate slots
  const slots: { start: string; end: string }[] = [];
  const [openHour, openMin] = settings.opening_time.split(":").map(Number);
  const [closeHour, closeMin] = settings.closing_time.split(":").map(Number);

  const current = new Date(date);
  current.setHours(openHour, openMin, 0, 0);

  const closing = new Date(date);
  closing.setHours(closeHour, closeMin, 0, 0);

  while (current < closing) {
    const slotEnd = addMinutes(current, durationMinutes);

    if (slotEnd <= closing) {
      // Check if slot conflicts with existing appointments
      const hasConflict = appointments?.some((apt: AppointmentSlot) => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        return current < aptEnd && slotEnd > aptStart;
      });

      if (!hasConflict) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    current.setMinutes(
      current.getMinutes() + settings.slot_duration_minutes
    );
  }

  return slots;
}

