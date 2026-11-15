import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import type { LocalDate, LocalTime } from "@/lib/scheduling/types";

// Datas locais ("YYYY-MM-DD") são calculadas em UTC puro, sem depender do fuso da máquina.
function parseLocalDate(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatUtcDate(ms: number): LocalDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return formatUtcDate(parseLocalDate(date) + days * 86_400_000);
}

/** Diferença em dias de calendário: b - a. */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86_400_000);
}

/** 0 = domingo ... 6 = sábado */
export function weekdayOf(date: LocalDate): number {
  return new Date(parseLocalDate(date)).getUTCDay();
}

/** Data local de um instante no fuso dado. */
export function toLocalDate(instant: Date, timeZone: string): LocalDate {
  return formatInTimeZone(instant, timeZone, "yyyy-MM-dd");
}

/** Hora local "HH:mm" de um instante no fuso dado. */
export function toLocalTime(instant: Date, timeZone: string): LocalTime {
  return formatInTimeZone(instant, timeZone, "HH:mm");
}

/** Instante (UTC) de uma data + hora de parede no fuso dado. */
export function zonedToUtc(date: LocalDate, time: LocalTime, timeZone: string): Date {
  return fromZonedTime(`${date}T${normalizeTime(time)}:00`, timeZone);
}

/** "08:00:00" (formato do Postgres) ou "8:00" -> "08:00" */
export function normalizeTime(time: string): LocalTime {
  const [h, m = "0"] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function timeToMinutes(time: LocalTime): number {
  const [h, m] = normalizeTime(time).split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}
