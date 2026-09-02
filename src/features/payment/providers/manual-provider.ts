import type {
  PaymentIntentRequest,
  PaymentIntentResult,
  PaymentProvider,
  PaymentWebhookEvent,
} from "@/types/payment";

/**
 * Default provider while no payment gateway credentials exist. Represents
 * "pay on the day" — it never actually moves money, it just gives the
 * booking flow a real, typed result to confirm against so the UI and API
 * contract are already correct when Stripe (or another gateway) is dropped
 * in behind the same PaymentProvider interface.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly id = "manual";

  async createPaymentIntent(
    request: PaymentIntentRequest
  ): Promise<PaymentIntentResult> {
    return {
      providerReference: `manual_${request.appointmentId}_${Date.now()}`,
    };
  }

  verifyWebhook(): PaymentWebhookEvent {
    throw new Error(
      "ManualPaymentProvider has no webhooks — confirmation is manual."
    );
  }
}
