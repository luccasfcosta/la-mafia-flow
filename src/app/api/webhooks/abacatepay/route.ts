import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  validateWebhookSignature,
  parseWebhookPayload,
} from "@/lib/abacatepay/webhook";
import { processPaymentConfirmed } from "@/services/payments";

/**
 * AbacatePay Webhook Handler
 *
 * This endpoint receives webhooks from AbacatePay and processes them
 * idempotently using the webhook_events table.
 */
export async function POST(request: NextRequest) {
  // Using any to bypass Supabase type inference issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature") || "";

    // Validate signature
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const event = parseWebhookPayload(rawBody);

    // Extract event ID for idempotency
    const providerEventId = event.data.id;
    const eventType = event.event;

    // Check if we've already processed this event (idempotency)
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id, status")
      .eq("provider", "abacatepay")
      .eq("provider_event_id", providerEventId)
      .single();

    if (existingEvent) {
      // Already processed or processing
      if (existingEvent.status === "processed") {
        return NextResponse.json({ message: "Already processed" });
      }

      if (existingEvent.status === "processing") {
        // Another process is handling this
        return NextResponse.json({ message: "Processing in progress" });
      }
    }

    // Record webhook event
    const { data: webhookEvent, error: insertError } = await supabase
      .from("webhook_events")
      .upsert(
        {
          provider: "abacatepay",
          event_type: eventType,
          provider_event_id: providerEventId,
          payload: event,
          headers: Object.fromEntries(request.headers.entries()),
          signature,
          signature_valid: !!webhookSecret,
          status: "processing",
          received_at: new Date().toISOString(),
        },
        {
          onConflict: "provider,provider_event_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (insertError) {
      console.error("Error recording webhook event:", insertError);
      // Still try to process if it's a duplicate key error
      if (!insertError.message?.includes("duplicate")) {
        throw insertError;
      }
    }

    // Process the event based on type
    let processingError: string | null = null;

    try {
      switch (eventType) {
        case "billing.paid": {
          // Get payment intent from metadata
          const paymentIntentId = event.data.metadata?.payment_intent_id;

          if (paymentIntentId) {
            const result = await processPaymentConfirmed(paymentIntentId);

            if (!result.success) {
              processingError = result.error || "Processing failed";
            }
          } else {
            // Try to find by provider reference
            const { data: paymentIntent } = await supabase
              .from("payment_intents")
              .select("id")
              .eq("provider_ref", event.data.id)
              .single();

            if (paymentIntent) {
              const result = await processPaymentConfirmed(paymentIntent.id);

              if (!result.success) {
                processingError = result.error || "Processing failed";
              }
            } else {
              processingError = "Payment intent not found";
            }
          }
          break;
        }

        case "billing.expired":
        case "billing.cancelled": {
          // Update payment intent status
          const { data: paymentIntent } = await supabase
            .from("payment_intents")
            .select("id")
            .eq("provider_ref", event.data.id)
            .single();

          if (paymentIntent) {
            await supabase
              .from("payment_intents")
              .update({
                status: eventType === "billing.expired" ? "expired" : "cancelled",
              })
              .eq("id", paymentIntent.id);
          }
          break;
        }

        case "billing.refunded": {
          // Handle refund
          const { data: paymentIntent } = await supabase
            .from("payment_intents")
            .select("id, amount, client_id")
            .eq("provider_ref", event.data.id)
            .single();

          if (paymentIntent) {
            // Update payment intent
            await supabase
              .from("payment_intents")
              .update({ status: "refunded" })
              .eq("id", paymentIntent.id);

            // Create ledger entry for refund
            await supabase.from("ledger_entries").insert({
              kind: "debit",
              category: "refund",
              amount: event.data.paidAmount || paymentIntent.amount,
              description: "Reembolso de pagamento",
              reference_table: "payment_intents",
              reference_id: paymentIntent.id,
              payment_intent_id: paymentIntent.id,
            });
          }
          break;
        }

        case "subscription.cancelled": {
          // Handle subscription cancellation
          const subscriptionId = event.data.id;

          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("abacatepay_subscription_id", subscriptionId);
          break;
        }

        case "subscription.payment_failed": {
          // Handle failed subscription payment
          const subscriptionId = event.data.id;

          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("abacatepay_subscription_id", subscriptionId);
          break;
        }

        default:
          // Unknown event type - log but don't fail
          console.log(`Unhandled webhook event type: ${eventType}`);
      }
    } catch (error) {
      processingError =
        error instanceof Error ? error.message : "Unknown processing error";
      console.error("Error processing webhook:", error);
    }

    // Update webhook event status
    if (webhookEvent) {
      await supabase
        .from("webhook_events")
        .update({
          status: processingError ? "failed" : "processed",
          processed_at: new Date().toISOString(),
          error_message: processingError,
        })
        .eq("id", webhookEvent.id);
    }

    if (processingError) {
      // Return 200 anyway to prevent retries for permanent failures
      return NextResponse.json({
        message: "Processed with errors",
        error: processingError,
      });
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Webhook handler error:", error);

    // Return 500 for unexpected errors (AbacatePay will retry)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Respond to GET requests with method not allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
