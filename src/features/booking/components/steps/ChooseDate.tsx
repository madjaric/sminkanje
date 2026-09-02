"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useBookingStore } from "../../store";

function nextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function ChooseDate() {
  const { draft, setDate, next } = useBookingStore();
  const days = useMemo(() => nextDays(21), []);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const isSunday = d.getDay() === 0;
        const isSelected = draft.date === iso;

        return (
          <button
            key={iso}
            disabled={isSunday}
            onClick={() => {
              setDate(iso);
              next();
            }}
            className={cn(
              "flex flex-col items-center gap-1 border border-white/10 py-4 font-sans transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30",
              isSelected ? "border-gold/60 bg-surface" : "hover:border-gold/40"
            )}
          >
            <span className="text-[10px] uppercase tracking-editorial text-foreground-muted">
              {d.toLocaleDateString("sr-Latn-RS", { weekday: "short" })}
            </span>
            <span className="font-serif text-xl text-foreground">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
