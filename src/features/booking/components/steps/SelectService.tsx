import { services } from "@/content/services";
import { useBookingStore } from "../../store";
import { cn } from "@/lib/utils";

export function SelectService() {
  const { draft, setService, next } = useBookingStore();

  return (
    <div className="grid gap-3">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => {
            setService(service.id);
            next();
          }}
          className={cn(
            "flex items-center justify-between border border-white/10 px-6 py-5 text-left transition-colors duration-300 hover:border-gold/50",
            draft.serviceId === service.id && "border-gold/60 bg-surface"
          )}
        >
          <div>
            <p className="font-serif text-2xl text-foreground">{service.name}</p>
            <p className="mt-1 font-sans text-sm text-foreground-muted">
              {service.shortDescription}
            </p>
          </div>
          <div className="shrink-0 pl-6 text-right font-sans text-xs uppercase tracking-editorial text-foreground-muted">
            <p>{service.durationMinutes} min</p>
            <p className="mt-1 text-gold">Od €{service.priceFrom}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
