export type PaymentMode = "deposit" | "full" | "in-person";

export interface PaymentIntentRequest {
  appointmentId: string;
  amount: number;
  currency: "EUR";
  mode: PaymentMode;
}

export interface PaymentIntentResult {
  /** Opaque id the provider uses to reconcile the payment later. */
  providerReference: string;
  /** URL to redirect the client to, when the provider is redirect-based. */
  redirectUrl?: string;
  /** Client secret / token for providers using an embedded element. */
  clientSecret?: string;
}

export interface PaymentWebhookEvent {
  providerReference: string;
  status: "succeeded" | "failed" | "refunded";
  raw: unknown;
}

/**
 * Every gateway (Stripe, a local bank provider, pay-in-person) implements
 * this so the booking UI never talks to a provider SDK directly. Swapping
 * providers means writing one new class, not touching booking components.
 */
export interface PaymentProvider {
  readonly id: string;
  createPaymentIntent(
    request: PaymentIntentRequest
  ): Promise<PaymentIntentResult>;
  verifyWebhook(payload: unknown, signature: string): PaymentWebhookEvent;
}
