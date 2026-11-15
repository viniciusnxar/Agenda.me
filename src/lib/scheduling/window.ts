import { addDays, diffDays, toLocalDate } from "@/lib/scheduling/time";
import type { LocalDate, SchedulingSettings } from "@/lib/scheduling/types";

export type BookingWindow = {
  first: LocalDate;
  last: LocalDate;
};

type WindowSettings = Pick<SchedulingSettings, "windowMode" | "minAdvanceDays" | "maxAdvanceDays">;

/** Primeiro e último dia agendáveis; "hoje" é a data atual no fuso do profissional. */
export function getBookingWindow(settings: WindowSettings, now: Date, timeZone: string): BookingWindow {
  const today = toLocalDate(now, timeZone);

  switch (settings.windowMode) {
    case "same_day_only":
      return { first: today, last: today };
    case "next_day_only": {
      const tomorrow = addDays(today, 1);
      return { first: tomorrow, last: tomorrow };
    }
    case "flexible":
      return {
        first: addDays(today, settings.minAdvanceDays),
        last: addDays(today, settings.maxAdvanceDays),
      };
  }
}

export function isInWindow(date: LocalDate, window: BookingWindow): boolean {
  return date >= window.first && date <= window.last; // "YYYY-MM-DD" ordena como texto
}

export function listWindowDates(window: BookingWindow): LocalDate[] {
  const total = diffDays(window.first, window.last);
  return Array.from({ length: Math.max(total + 1, 0) }, (_, i) => addDays(window.first, i));
}
