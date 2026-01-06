"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface AuditLogInput {
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const supabase = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_logs") as any).insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      old_values: input.oldValues,
      new_values: input.newValues,
      metadata: input.metadata || {},
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entity: string,
  entityId?: string,
  limit = 50
) {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("audit_logs") as any)
    .select("*")
    .eq("entity", entity)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get audit logs by actor
 */
export async function getAuditLogsByActor(actorUserId: string, limit = 50) {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("audit_logs") as any)
    .select("*")
    .eq("actor_user_id", actorUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit = 100) {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("audit_logs") as any)
    .select(
      `
      *,
      actor:profiles(full_name, email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Common audit actions
export const AuditActions = {
  // Auth
  LOGIN: "login",
  LOGOUT: "logout",
  PASSWORD_RESET: "password_reset",

  // CRUD
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  SOFT_DELETE: "soft_delete",

  // Appointments
  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_CONFIRMED: "appointment.confirmed",
  APPOINTMENT_CANCELLED: "appointment.cancelled",
  APPOINTMENT_COMPLETED: "appointment.completed",

  // Payments
  PAYMENT_CREATED: "payment.created",
  PAYMENT_CONFIRMED: "payment.confirmed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Subscriptions
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  SUBSCRIPTION_PAUSED: "subscription.paused",

  // Settings
  SETTINGS_UPDATED: "settings.updated",
} as const;

