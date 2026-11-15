import { normalizeTime } from "@/lib/scheduling/time";
import type {
  AvailabilityException,
  BusyRange,
  SchedulingSettings,
  WeeklyRule,
  WindowMode,
} from "@/lib/scheduling/types";
import type { Database, Tables } from "@/types/database";

// Linhas do banco (snake_case, horas "HH:mm:ss", datas em texto) -> tipos do motor.

const WINDOW_MODES: readonly WindowMode[] = ["flexible", "same_day_only", "next_day_only"];

export function toSchedulingSettings(row: Tables<"booking_settings">): SchedulingSettings {
  if (!WINDOW_MODES.includes(row.window_mode as WindowMode)) {
    throw new Error(`window_mode desconhecido: ${row.window_mode}`);
  }
  return {
    slotDurationMin: row.slot_duration_min,
    bufferMin: row.buffer_min,
    windowMode: row.window_mode as WindowMode,
    minAdvanceDays: row.min_advance_days,
    maxAdvanceDays: row.max_advance_days,
    minNoticeMinutes: row.min_notice_minutes,
    maxPerDay: row.max_per_day,
  };
}

export function toWeeklyRules(
  rows: Pick<Tables<"availability_rules">, "weekday" | "start_time" | "end_time">[],
): WeeklyRule[] {
  return rows.map((r) => ({ weekday: r.weekday, start: normalizeTime(r.start_time), end: normalizeTime(r.end_time) }));
}

export function toExceptions(
  rows: Pick<Tables<"availability_exceptions">, "date" | "is_blocked" | "start_time" | "end_time">[],
): AvailabilityException[] {
  return rows.map((r) => ({
    date: r.date,
    isBlocked: r.is_blocked,
    start: r.start_time ? normalizeTime(r.start_time) : null,
    end: r.end_time ? normalizeTime(r.end_time) : null,
  }));
}

type BusyRow = Database["public"]["Functions"]["get_busy_ranges"]["Returns"][number];

export function toBusyRanges(rows: BusyRow[]): BusyRange[] {
  return rows.map((r) => ({ start: new Date(r.starts_at), end: new Date(r.blocked_until) }));
}
