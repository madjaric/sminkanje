import { NextResponse } from "next/server";
import { z } from "zod";
import { services } from "@/content/services";
import { getPaymentProvider } from "@/features/payment/get-payment-provider";
import type { Appointment } from "@/types/booking";

const bookingRequestSchema = z.object({
  serviceId: z.string(),
  date: z.string(),
  slot: z.object({ start: z.string(), end: z.string() }),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
    notes: z.string().optional(),
  }),
  paymentMode: z.enum(["deposit", "full", "in-person"]),
});

/**
 * Booking confirmation is decided here, not on the client — the frontend
 * only ever renders whatever this endpoint returns. There is no database
 * behind this yet (see prisma/schema.prisma for the target shape); it
 * validates the request and returns a PENDING appointment shaped exactly
 * like the eventual persisted record so the booking UI doesn't change when
 * a real datastore and payment webhook are wired in.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { serviceId, slot, customer, paymentMode } = parsed.data;
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const appointmentId = `apt_${Date.now()}`;
  const provider = getPaymentProvider();
  const amount =
    paymentMode === "deposit" ? service.depositAmount ?? service.priceFrom : service.priceFrom;

  const paymentIntent =
    paymentMode === "in-person"
      ? null
      : await provider.createPaymentIntent({
          appointmentId,
          amount,
          currency: "EUR",
          mode: paymentMode,
        });

  return NextResponse.json({
    appointment: {
      id: appointmentId,
      serviceId,
      customer,
      slot,
      status: paymentMode === "in-person" ? "CONFIRMED" : "PAYMENT_PENDING",
      paymentStatus: paymentMode === "in-person" ? "UNPAID" : "DEPOSIT_PENDING",
      paymentId: paymentIntent?.providerReference,
      createdAt: new Date().toISOString(),
    } satisfies Appointment,
  });
}
