import { createHmac } from "crypto";
import type { WebhookEvent } from "./types";

/**
 * Validate webhook signature from AbacatePay
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Parse webhook payload
 */
export function parseWebhookPayload(payload: string): WebhookEvent {
  try {
    return JSON.parse(payload) as WebhookEvent;
  } catch {
    throw new Error("Invalid webhook payload");
  }
}

