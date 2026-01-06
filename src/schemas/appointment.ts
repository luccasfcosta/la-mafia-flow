import { z } from "zod";

export const createAppointmentSchema = z.object({
  client_id: z.string().uuid("ID de cliente inválido"),
  barber_id: z.string().uuid("ID de barbeiro inválido"),
  service_id: z.string().uuid("ID de serviço inválido"),
  start_time: z.string().datetime("Data/hora inválida"),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  id: z.string().uuid("ID inválido"),
  client_id: z.string().uuid("ID de cliente inválido").optional(),
  barber_id: z.string().uuid("ID de barbeiro inválido").optional(),
  service_id: z.string().uuid("ID de serviço inválido").optional(),
  start_time: z.string().datetime("Data/hora inválida").optional(),
  status: z
    .enum([
      "scheduled",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
  notes: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  id: z.string().uuid("ID inválido"),
  cancelled_reason: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

