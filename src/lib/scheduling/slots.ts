import { addMinutes, toLocalDate, weekdayOf, zonedToUtc } from "@/lib/scheduling/time";
import type {
  AvailabilityException,
  BusyRange,
  LocalDate,
  SchedulingSettings,
  Slot,
  TimeInterval,
  WeeklyRule,
} from "@/lib/scheduling/types";

export type GenerateSlotsInput = {
  date: LocalDate;
  settings: SchedulingSettings;
  weeklyRules: WeeklyRule[];
  exceptions: AvailabilityException[];
  /** Agendamentos ativos (pending/confirmed): [starts_at, blocked_until) */
  busyRanges: BusyRange[];
  now: Date;
  timezone: string;
};

/** Expediente do dia: null = dia bloqueado. Horário especial substitui as regras semanais. */
export function getDayIntervals(
  date: LocalDate,
  weeklyRules: WeeklyRule[],
  exceptions: AvailabilityException[],
): TimeInterval[] | null {
  const dayExceptions = exceptions.filter((e) => e.date === date);
  if (dayExceptions.some((e) => e.isBlocked)) return null;

  const special = dayExceptions.filter((e) => e.start && e.end).map((e) => ({ start: e.start!, end: e.end! }));
  const intervals = special.length > 0 ? special : weeklyRules.filter((r) => r.weekday === weekdayOf(date));

  return intervals
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Agendamentos ativos que começam no dia (no fuso do profissional). */
export function countBookingsOnDate(date: LocalDate, busyRanges: BusyRange[], timezone: string): number {
  return busyRanges.filter((b) => toLocalDate(b.start, timezone) === date).length;
}

function overlaps(start: Date, end: Date, busy: BusyRange): boolean {
  return start < busy.end && end > busy.start;
}

/** Horários livres de um dia, seguindo a seção 5 da arquitetura. Função pura. */
export function generateSlots({
  date,
  settings,
  weeklyRules,
  exceptions,
  busyRanges,
  now,
  timezone,
}: GenerateSlotsInput): Slot[] {
  const intervals = getDayIntervals(date, weeklyRules, exceptions);
  if (!intervals) return [];

  if (settings.maxPerDay !== null && countBookingsOnDate(date, busyRanges, timezone) >= settings.maxPerDay) {
    return [];
  }

  const earliest = addMinutes(now, settings.minNoticeMinutes);
  const step = settings.slotDurationMin + settings.bufferMin;
  const slots: Slot[] = [];

  for (const interval of intervals) {
    const intervalEnd = zonedToUtc(date, interval.end, timezone);

    for (
      let start = zonedToUtc(date, interval.start, timezone);
      addMinutes(start, settings.slotDurationMin) <= intervalEnd;
      start = addMinutes(start, step)
    ) {
      const end = addMinutes(start, settings.slotDurationMin);
      const blockedUntil = addMinutes(end, settings.bufferMin);

      if (start < earliest) continue;
      if (busyRanges.some((b) => overlaps(start, blockedUntil, b))) continue;

      slots.push({ start, end, blockedUntil });
    }
  }

  return slots;
}
