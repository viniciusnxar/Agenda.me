import { describe, expect, it } from "vitest";

import { toBusyRanges, toExceptions, toSchedulingSettings, toWeeklyRules } from "@/lib/scheduling/mappers";
import {
  addDays,
  diffDays,
  normalizeTime,
  timeToMinutes,
  toLocalDate,
  toLocalTime,
  weekdayOf,
  zonedToUtc,
} from "@/lib/scheduling/time";
import type { Tables } from "@/types/database";

describe("datas locais", () => {
  it("addDays atravessa mês e ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("diffDays", () => {
    expect(diffDays("2026-12-01", "2026-12-31")).toBe(30);
    expect(diffDays("2026-12-01", "2026-11-30")).toBe(-1);
  });
  it("weekdayOf", () => {
    expect(weekdayOf("2026-12-01")).toBe(2); // terça
    expect(weekdayOf("2026-12-06")).toBe(0); // domingo
  });
});

describe("fuso horário", () => {
  const tz = "America/Fortaleza"; // UTC-3, sem horário de verão

  it("21h em Fortaleza já é o dia seguinte em UTC", () => {
    const instant = zonedToUtc("2026-12-01", "21:00", tz);
    expect(instant.toISOString()).toBe("2026-12-02T00:00:00.000Z");
    expect(toLocalDate(instant, tz)).toBe("2026-12-01");
    expect(toLocalTime(instant, tz)).toBe("21:00");
  });
  it("aceita hora no formato do Postgres", () => {
    expect(zonedToUtc("2026-12-01", "08:00:00", tz).toISOString()).toBe("2026-12-01T11:00:00.000Z");
  });
  it("respeita horário de verão de outro fuso", () => {
    // Nova York: UTC-4 em julho, UTC-5 em dezembro
    expect(zonedToUtc("2026-07-01", "09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedToUtc("2026-12-01", "09:00", "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });
});

describe("horas", () => {
  it("normalizeTime e timeToMinutes", () => {
    expect(normalizeTime("08:00:00")).toBe("08:00");
    expect(normalizeTime("8:5")).toBe("08:05");
    expect(timeToMinutes("13:30")).toBe(810);
  });
});

describe("mappers", () => {
  it("booking_settings -> SchedulingSettings", () => {
    const row = {
      slot_duration_min: 50,
      buffer_min: 10,
      window_mode: "next_day_only",
      min_advance_days: 0,
      max_advance_days: 30,
      min_notice_minutes: 120,
      max_per_day: null,
    } as Tables<"booking_settings">;
    expect(toSchedulingSettings(row)).toEqual({
      slotDurationMin: 50,
      bufferMin: 10,
      windowMode: "next_day_only",
      minAdvanceDays: 0,
      maxAdvanceDays: 30,
      minNoticeMinutes: 120,
      maxPerDay: null,
    });
    expect(() => toSchedulingSettings({ ...row, window_mode: "x" })).toThrow();
  });
  it("regras, exceções e intervalos ocupados", () => {
    expect(toWeeklyRules([{ weekday: 1, start_time: "08:00:00", end_time: "12:00:00" }])).toEqual([
      { weekday: 1, start: "08:00", end: "12:00" },
    ]);
    expect(
      toExceptions([
        { date: "2026-12-25", is_blocked: true, start_time: null, end_time: null },
        { date: "2026-12-24", is_blocked: false, start_time: "08:00:00", end_time: "12:00:00" },
      ]),
    ).toEqual([
      { date: "2026-12-25", isBlocked: true, start: null, end: null },
      { date: "2026-12-24", isBlocked: false, start: "08:00", end: "12:00" },
    ]);
    const [busy] = toBusyRanges([{ starts_at: "2026-12-01T12:00:00+00:00", blocked_until: "2026-12-01T13:00:00+00:00" }]);
    expect(busy.start.toISOString()).toBe("2026-12-01T12:00:00.000Z");
    expect(busy.end.toISOString()).toBe("2026-12-01T13:00:00.000Z");
  });
});
