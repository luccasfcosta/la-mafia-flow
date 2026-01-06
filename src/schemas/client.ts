import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
  preferred_barber_id: z.string().uuid().optional().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid("ID inválido"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

