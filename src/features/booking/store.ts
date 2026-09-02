import { create } from "zustand";
import type { BookingDraft, CustomerDetails, TimeSlot } from "@/types/booking";

export const BOOKING_STEPS = [
  "Odaberite uslugu",
  "Odaberite datum",
  "Odaberite vreme",
  "Vaši podaci",
  "Potvrda i plaćanje",
] as const;

export type BookingStepIndex = 0 | 1 | 2 | 3 | 4;

interface BookingStore {
  step: BookingStepIndex;
  draft: BookingDraft;
  goTo: (step: BookingStepIndex) => void;
  next: () => void;
  back: () => void;
  setService: (serviceId: string) => void;
  setDate: (date: string) => void;
  setSlot: (slot: TimeSlot) => void;
  setCustomer: (customer: CustomerDetails) => void;
  reset: () => void;
}

const initialDraft: BookingDraft = {
  serviceId: null,
  date: null,
  slot: null,
  customer: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  step: 0,
  draft: initialDraft,
  goTo: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, 4) as BookingStepIndex })),
  back: () => set((s) => ({ step: Math.max(s.step - 1, 0) as BookingStepIndex })),
  setService: (serviceId) =>
    set((s) => ({ draft: { ...s.draft, serviceId } })),
  setDate: (date) => set((s) => ({ draft: { ...s.draft, date, slot: null } })),
  setSlot: (slot) => set((s) => ({ draft: { ...s.draft, slot } })),
  setCustomer: (customer) => set((s) => ({ draft: { ...s.draft, customer } })),
  reset: () => set({ step: 0, draft: initialDraft }),
}));
