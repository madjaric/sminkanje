import { BOOKING_STEPS } from "../store";
import { cn } from "@/lib/utils";

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-8 gap-y-3">
      {BOOKING_STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "font-sans text-[10px] tabular-nums",
              i === current ? "text-gold" : "text-foreground-muted/50"
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "font-sans text-[10px] uppercase tracking-editorial",
              i === current ? "text-foreground" : "text-foreground-muted/50"
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
