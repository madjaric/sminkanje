"use client";

import { useMemo } from "react";
import { services } from "@/content/services";
import { getAvailableSlots } from "@/features/availability/get-available-slots";
import { cn } from "@/lib/utils";
import { useBookingStore } from "../../store";

export function SelectTime() {
  const { draft, setSlot, next } = useBookingStore();
  const service = services.find((s) => s.id === draft.serviceId);

  const slots = useMemo(() => {
    if (!draft.date || !service) return [];
    return getAvailableSlots(draft.date, service.durationMinutes);
  }, [draft.date, service]);

  if (!draft.date || !service) return null;

  if (slots.length === 0) {
    return (
      <p className="font-sans text-sm text-foreground-muted">
        Nema slobodnih termina tog dana — izaberite drugi datum.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = draft.slot?.start === slot.start;
        return (
          <button
            key={slot.start}
            onClick={() => {
              setSlot(slot);
              next();
            }}
            className={cn(
              "border border-white/10 py-3 font-sans text-sm tabular-nums text-foreground transition-colors duration-300 hover:border-gold/50",
              isSelected && "border-gold/60 bg-surface text-gold"
            )}
          >
            {new Date(slot.start).toLocaleTimeString("sr-Latn-RS", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </button>
        );
      })}
    </div>
  );
}
