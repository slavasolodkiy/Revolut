/**
 * Payments Rail Integration Stub
 *
 * Covers: SEPA, SWIFT, UK Faster Payments, internal transfers.
 * In production: integrate with Modulr, Stripe, or direct rail access.
 *
 * Modulr docs: https://modulr.readme.io/
 * Stripe Treasury: https://stripe.com/docs/treasury
 */

export type PaymentRail = "sepa_instant" | "sepa_credit" | "swift" | "uk_faster_payments" | "bacs" | "ach";

export interface PaymentInstruction {
  rail: PaymentRail;
  fromIban?: string;
  toIban: string;
  toBic?: string;
  toName: string;
  amount: number;
  currency: string;
  reference?: string;
  idempotencyKey: string;
}

export interface PaymentResult {
  externalId: string;
  status: "accepted" | "rejected" | "pending";
  estimatedArrival?: string;
  failureReason?: string;
}

export interface WebhookEvent {
  type: "payment.completed" | "payment.failed" | "payment.returned";
  externalId: string;
  status: "completed" | "failed" | "returned";
  timestamp: string;
  failureCode?: string;
  failureMessage?: string;
}

/**
 * Stub: Submit a payment to the payments rail.
 * In production: POST to Modulr /payments or Stripe Treasury transfer endpoint.
 */
export async function submitPayment(instruction: PaymentInstruction): Promise<PaymentResult> {
  console.log("[Payments Stub] Submitting payment:", instruction.idempotencyKey, instruction.rail, instruction.amount, instruction.currency);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate a small failure rate
  if (Math.random() < 0.02) {
    return {
      externalId: `stub-rejected-${Date.now()}`,
      status: "rejected",
      failureReason: "INVALID_IBAN",
    };
  }

  return {
    externalId: `stub-${instruction.rail}-${Date.now()}`,
    status: "accepted",
    estimatedArrival: new Date(Date.now() + getRailLatencyMs(instruction.rail)).toISOString(),
  };
}

/**
 * Stub: Process incoming payment webhook.
 * In production: validate HMAC, update payment status in DB, trigger notification.
 */
export async function processPaymentWebhook(event: WebhookEvent): Promise<void> {
  console.log("[Payments Stub] Webhook received:", event.type, event.externalId);
  // In production:
  // 1. Validate webhook signature
  // 2. Find payment by externalId
  // 3. Update status in DB
  // 4. If completed: credit destination account, send notification
  // 5. If failed: reverse debit, send failure notification
}

/**
 * Get payment rail fee estimate.
 */
export function estimateFee(rail: PaymentRail, amount: number, _currency: string): number {
  const fees: Record<PaymentRail, number | ((amount: number) => number)> = {
    sepa_instant: 0.20,
    sepa_credit: 0,
    swift: 5.00,
    uk_faster_payments: 0,
    bacs: 0,
    ach: 0.25,
  };
  const fee = fees[rail];
  return typeof fee === "function" ? fee(amount) : fee;
}

function getRailLatencyMs(rail: PaymentRail): number {
  const latency: Record<PaymentRail, number> = {
    sepa_instant: 10_000,
    sepa_credit: 86_400_000, // 1 day
    swift: 3 * 86_400_000,   // 3 days
    uk_faster_payments: 10_000,
    bacs: 3 * 86_400_000,
    ach: 2 * 86_400_000,
  };
  return latency[rail] || 86_400_000;
}
