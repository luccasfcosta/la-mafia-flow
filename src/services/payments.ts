"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAbacatePayClient } from "@/lib/abacatepay/client";
import { randomUUID } from "crypto";

interface CreatePaymentIntentInput {
  clientId: string;
  appointmentId?: string;
  amount: number;
  type?: "one_time" | "subscription";
  description?: string;
}

interface PaymentIntentResult {
  paymentIntentId: string;
  checkoutUrl?: string;
  pixCode?: string;
  qrCode?: string;
}

/**
 * Create a payment intent and generate billing via AbacatePay
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<{ data?: PaymentIntentResult; error?: string }> {
  const supabase = createAdminClient();

  // Generate idempotency key
  const idempotencyKey = `pi_${randomUUID()}`;

  try {
    // Get client data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client } = await (supabase.from("clients") as any)
      .select("id, name, email, phone")
      .eq("id", input.clientId)
      .single();

    if (!client) {
      return { error: "Cliente não encontrado" };
    }

    // Create payment intent in database first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paymentIntent, error: insertError } = await (supabase.from("payment_intents") as any)
      .insert({
        client_id: input.clientId,
        appointment_id: input.appointmentId,
        amount: input.amount,
        type: input.type || "one_time",
        status: "pending",
        provider: "abacatepay",
        idempotency_key: idempotencyKey,
        metadata: {
          description: input.description,
        },
      })
      .select()
      .single();

    if (insertError || !paymentIntent) {
      console.error("Error creating payment intent:", insertError);
      return { error: "Erro ao criar intenção de pagamento" };
    }

    // Call AbacatePay API
    const abacatePay = getAbacatePayClient();

    const billing = await abacatePay.createBilling({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: paymentIntent.id,
          name: input.description || "Serviço de Barbearia",
          quantity: 1,
          price: Math.round(input.amount * 100), // Convert to cents
        },
      ],
      customer: {
        name: client.name,
        email: client.email || undefined,
        cellphone: client.phone || undefined,
      },
      metadata: {
        payment_intent_id: paymentIntent.id,
        client_id: client.id,
        appointment_id: input.appointmentId || "",
      },
    });

    // Update payment intent with provider reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("payment_intents") as any)
      .update({
        provider_ref: billing.id,
        provider_checkout_url: billing.url,
        provider_qr_code: billing.pix?.qrCodeImage,
        provider_pix_code: billing.pix?.brCode,
        status: "processing",
      })
      .eq("id", paymentIntent.id);

    return {
      data: {
        paymentIntentId: paymentIntent.id,
        checkoutUrl: billing.url,
        pixCode: billing.pix?.brCode,
        qrCode: billing.pix?.qrCodeImage,
      },
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { error: "Erro ao processar pagamento" };
  }
}

/**
 * Process a confirmed payment (called from webhook handler)
 */
export async function processPaymentConfirmed(
  paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  try {
    // Get payment intent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paymentIntent } = await (supabase.from("payment_intents") as any)
      .select("*, appointment:appointments(*)")
      .eq("id", paymentIntentId)
      .single();

    if (!paymentIntent) {
      return { success: false, error: "Payment intent não encontrado" };
    }

    if (paymentIntent.status === "paid") {
      // Already processed
      return { success: true };
    }

    // Start transaction-like operations
    // 1. Update payment intent status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("payment_intents") as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentIntentId);

    if (updateError) {
      throw new Error(`Error updating payment intent: ${updateError.message}`);
    }

    // 2. Create ledger entry for the credit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("ledger_entries") as any).insert({
      kind: "credit",
      category: "service_payment",
      amount: paymentIntent.amount,
      description: "Pagamento de serviço",
      reference_table: "payment_intents",
      reference_id: paymentIntentId,
      payment_intent_id: paymentIntentId,
    });

    // 3. If there's an appointment, create commission
    if (paymentIntent.appointment_id) {
      const appointment = paymentIntent.appointment as {
        barber_id: string;
        service_id: string;
      };

      // Get barber commission percentage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: barber } = await (supabase.from("barbers") as any)
        .select("id, name, commission_percentage")
        .eq("id", appointment.barber_id)
        .single();

      if (barber) {
        const commissionAmount =
          (paymentIntent.amount * barber.commission_percentage) / 100;

        // Create commission record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: commission } = await (supabase.from("commissions") as any)
          .insert({
            barber_id: barber.id,
            appointment_id: paymentIntent.appointment_id,
            payment_intent_id: paymentIntentId,
            base_amount: paymentIntent.amount,
            percentage: barber.commission_percentage,
            commission_amount: commissionAmount,
            status: "approved",
          })
          .select()
          .single();

        // Create ledger entry for commission (debit)
        if (commission) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("ledger_entries") as any).insert({
            kind: "debit",
            category: "commission",
            amount: commissionAmount,
            description: `Comissão de ${barber.name}`,
            reference_table: "commissions",
            reference_id: commission.id,
            barber_id: barber.id,
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
