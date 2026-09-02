import { services } from "@/content/services";
import { useBookingStore } from "../store";

export function SummaryPanel({ className }: { className?: string }) {
  const draft = useBookingStore((s) => s.draft);
  const service = services.find((s) => s.id === draft.serviceId);

  return (
    <div className={className}>
      <p className="mb-6 font-sans text-[10px] uppercase tracking-editorial text-foreground-muted">
        Vaša rezervacija
      </p>

      <dl className="space-y-4 font-sans text-sm">
        <Row label="Usluga" value={service?.name ?? "—"} />
        <Row
          label="Datum"
          value={
            draft.date
              ? new Date(draft.date).toLocaleDateString("sr-Latn-RS", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : "—"
          }
        />
        <Row
          label="Vreme"
          value={
            draft.slot
              ? new Date(draft.slot.start).toLocaleTimeString("sr-Latn-RS", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
        />
      </dl>

      {service && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <Row label="Depozit sada" value={`€${service.depositAmount ?? 0}`} />
          <Row label="Ukupno" value={`€${service.priceFrom}`} muted />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className={muted ? "text-foreground-muted" : "text-foreground"}>{value}</dd>
    </div>
  );
}
