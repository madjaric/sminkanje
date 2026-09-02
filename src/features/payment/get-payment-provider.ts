import type { PaymentProvider } from "@/types/payment";
import { ManualPaymentProvider } from "./providers/manual-provider";

/**
 * Single seam for swapping payment gateways later (Stripe, a local bank
 * provider, ...). Every new provider registers here; nothing outside this
 * file or the PaymentProvider interface needs to change.
 */
export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? "manual";

  switch (configured) {
    case "manual":
      return new ManualPaymentProvider();
    // case "stripe":
    //   return new StripePaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${configured}`);
  }
}
