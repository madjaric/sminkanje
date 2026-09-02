/**
 * Domain types shared between the marketing site (service content, pricing
 * display) and the booking feature. Kept framework-agnostic so they can be
 * reused server-side once a real API/DB is wired in (see prisma/schema.prisma
 * for the persisted shape these mirror).
 */

export type ServiceCategory =
  | "bridal"
  | "soft-glam"
  | "full-glam"
  | "editorial"
  | "education";

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  shortDescription: string;
  durationMinutes: number;
  priceFrom: number;
  currency: "EUR";
  depositRequired: boolean;
  depositAmount?: number;
  imageSrc: string;
}

export type AppointmentStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type PaymentStatus =
  | "UNPAID"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PAID"
  | "PAID"
  | "REFUNDED";

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface TimeSlot {
  /** ISO 8601 */
  start: string;
  /** ISO 8601 */
  end: string;
}

export interface BookingDraft {
  serviceId: string | null;
  date: string | null; // ISO date, no time
  slot: TimeSlot | null;
  customer: CustomerDetails | null;
}

export interface Appointment {
  id: string;
  serviceId: string;
  customer: CustomerDetails;
  slot: TimeSlot;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt: string;
}
