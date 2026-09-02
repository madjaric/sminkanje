"use client";

import { useState } from "react";
import { services } from "@/content/services";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBookingStore } from "../../store";
import type { PaymentMode } from "@/types/payment";

const PAYMENT_MODES: { id: PaymentMode; label: string; helper: string }[] = [
  { id: "deposit", label: "Plati depozit", helper: "Obezbedite termin sada, ostatak platite na dan termina." },
  { id: "full", label: "Plati u celosti", helper: "Platite sve odmah." },
  { id: "in-person", label: "Plati na licu mesta", helper: "Platite na dan vašeg termina." },
];

export function ConfirmPay() {
  const { draft, reset } = useBookingStore();
  const service = services.find((s) => s.id === draft.serviceId);
  const [mode, setMode] = useState<PaymentMode>("deposit");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleConfirm() {
    if (!service || !draft.date || !draft.slot || !draft.customer) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date: draft.date,
          slot: draft.slot,
          customer: draft.customer,
          paymentMode: mode,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="max-w-md">
        <p className="font-serif text-3xl text-foreground">Rezervacija je primljena.</p>
        <p className="mt-4 font-sans text-sm text-foreground-muted">
          Potvrda će biti poslata na {draft.customer?.email}. Ovaj termin je na
          čekanju dok se plaćanje ne potvrdi.
        </p>
        <Button
          onClick={reset}
          variant="ghost"
          className="mt-8 rounded-none text-foreground-muted"
        >
          Zakaži novi termin
        </Button>
      </div>
    );
  }

  return (
    <div className="grid max-w-md gap-6">
      <div className="grid gap-2">
        {PAYMENT_MODES.map((option) => (
          <button
            key={option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              "border border-white/10 px-5 py-4 text-left transition-colors duration-300 hover:border-gold/40",
              mode === option.id && "border-gold/60 bg-surface"
            )}
          >
            <p className="font-sans text-sm text-foreground">{option.label}</p>
            <p className="mt-1 font-sans text-xs text-foreground-muted">{option.helper}</p>
          </button>
        ))}
      </div>

      {status === "error" && (
        <p className="font-sans text-xs text-destructive">
          Došlo je do greške. Pokušajte ponovo.
        </p>
      )}

      <Button
        onClick={handleConfirm}
        disabled={status === "submitting"}
        className="h-12 rounded-none bg-gold font-sans text-xs uppercase tracking-editorial text-primary-foreground hover:bg-gold/90"
      >
        {status === "submitting" ? "Potvrđivanje…" : "Potvrdi rezervaciju"}
      </Button>
    </div>
  );
}
