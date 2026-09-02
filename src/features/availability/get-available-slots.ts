import type { TimeSlot } from "@/types/booking";

const WORKING_HOURS = { start: 10, end: 18 };

/**
 * Stand-in for a server call (`GET /api/availability?date=&serviceId=`)
 * against the Availability/BlockedDate/Appointment tables in
 * prisma/schema.prisma. Deterministic per date so the UI is stable across
 * re-renders without needing real persistence yet.
 */
export function getAvailableSlots(
  date: string,
  durationMinutes: number
): TimeSlot[] {
  const day = new Date(date).getDay();
  if (day === 0) return []; // closed Sundays

  const seed = date.split("-").reduce((acc, part) => acc + Number(part), 0);
  const slots: TimeSlot[] = [];

  for (
    let hour = WORKING_HOURS.start;
    hour + durationMinutes / 60 <= WORKING_HOURS.end;
    hour += 1
  ) {
    const isTaken = (seed + hour) % 5 === 0;
    if (isTaken) continue;

    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    slots.push({ start: start.toISOString(), end: end.toISOString() });
  }

  return slots;
}
