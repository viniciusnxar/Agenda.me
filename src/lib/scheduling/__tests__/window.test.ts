import { describe, expect, it } from "vitest";

import { getBookingWindow, isInWindow, listWindowDates } from "@/lib/scheduling/window";

import { at, settings, TUESDAY, TZ } from "./fixtures";

const now = at(TUESDAY, "10:00");

describe("getBookingWindow", () => {
  it("same_day_only: só hoje", () => {
    expect(getBookingWindow({ ...settings, windowMode: "same_day_only" }, now, TZ)).toEqual({
      first: "2026-12-01",
      last: "2026-12-01",
    });
  });

  it("next_day_only: só amanhã", () => {
    expect(getBookingWindow({ ...settings, windowMode: "next_day_only" }, now, TZ)).toEqual({
      first: "2026-12-02",
      last: "2026-12-02",
    });
  });

  it("flexible: de hoje + min até hoje + max", () => {
    expect(getBookingWindow({ ...settings, minAdvanceDays: 2, maxAdvanceDays: 10 }, now, TZ)).toEqual({
      first: "2026-12-03",
      last: "2026-12-11",
    });
  });

  it("flexible com min 0 inclui hoje", () => {
    expect(getBookingWindow({ ...settings, minAdvanceDays: 0, maxAdvanceDays: 30 }, now, TZ)).toEqual({
      first: "2026-12-01",
      last: "2026-12-31",
    });
  });

  it("modos fixos ignoram min/max", () => {
    const s = { ...settings, minAdvanceDays: 5, maxAdvanceDays: 9 };
    expect(getBookingWindow({ ...s, windowMode: "same_day_only" }, now, TZ).first).toBe("2026-12-01");
    expect(getBookingWindow({ ...s, windowMode: "next_day_only" }, now, TZ).first).toBe("2026-12-02");
  });

  it("'hoje' é a data no fuso do profissional, não em UTC", () => {
    // 22h de terça em Fortaleza = 01h de quarta em UTC
    const lateNight = at(TUESDAY, "22:00");
    expect(lateNight.toISOString()).toBe("2026-12-02T01:00:00.000Z");
    expect(getBookingWindow({ ...settings, windowMode: "same_day_only" }, lateNight, TZ).first).toBe("2026-12-01");
    expect(getBookingWindow({ ...settings, windowMode: "next_day_only" }, lateNight, TZ).first).toBe("2026-12-02");
  });

  it("atravessa a virada do ano", () => {
    const w = getBookingWindow({ ...settings, windowMode: "next_day_only" }, at("2026-12-31", "09:00"), TZ);
    expect(w).toEqual({ first: "2027-01-01", last: "2027-01-01" });
  });
});

describe("isInWindow e listWindowDates", () => {
  const window = { first: "2026-12-30", last: "2027-01-02" };

  it("isInWindow inclui as pontas", () => {
    expect(isInWindow("2026-12-30", window)).toBe(true);
    expect(isInWindow("2027-01-02", window)).toBe(true);
    expect(isInWindow("2026-12-29", window)).toBe(false);
    expect(isInWindow("2027-01-03", window)).toBe(false);
  });

  it("listWindowDates lista todos os dias", () => {
    expect(listWindowDates(window)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(listWindowDates({ first: "2026-12-01", last: "2026-12-01" })).toEqual(["2026-12-01"]);
  });
});
