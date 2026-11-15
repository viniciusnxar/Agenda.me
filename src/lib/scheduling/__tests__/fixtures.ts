import { zonedToUtc } from "@/lib/scheduling/time";
import type { LocalDate, LocalTime, SchedulingSettings, WeeklyRule } from "@/lib/scheduling/types";

// Dados compartilhados pelos testes do motor de horários.

export const TZ = "America/Fortaleza"; // UTC-3, sem horário de verão

export const settings: SchedulingSettings = {
  slotDurationMin: 50,
  bufferMin: 10,
  windowMode: "flexible",
  minAdvanceDays: 0,
  maxAdvanceDays: 30,
  minNoticeMinutes: 120,
  maxPerDay: null,
};

/** Segunda a sexta, 08–12 e 14–18 (almoço das 12 às 14). */
export const weekdaysWithLunch: WeeklyRule[] = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start: "08:00", end: "12:00" },
  { weekday, start: "14:00", end: "18:00" },
]);

/** Instante de uma data + hora local em Fortaleza. */
export function at(date: LocalDate, time: LocalTime): Date {
  return zonedToUtc(date, time, TZ);
}

// 2026-12-01 é uma terça-feira
export const TUESDAY = "2026-12-01";
