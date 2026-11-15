import { describe, expect, it } from "vitest";

import { getMonthStatus, monthDates, type MonthStatusInput } from "@/lib/scheduling";

import { at, settings, TUESDAY, TZ, weekdaysWithLunch } from "./fixtures";

// Dezembro de 2026, "agora" é terça 01/12 às 05:00, agenda abre 10 dias à frente
const base: MonthStatusInput = {
  year: 2026,
  month: 12,
  settings: { ...settings, maxAdvanceDays: 10 },
  weeklyRules: weekdaysWithLunch,
  exceptions: [],
  busyRanges: [],
  now: at(TUESDAY, "05:00"),
  timezone: TZ,
};

const statusOf = (input: MonthStatusInput) =>
  Object.fromEntries(getMonthStatus(input).map((d) => [d.date, d.status]));

describe("monthDates", () => {
  it("lista os dias do mês, inclusive fevereiro bissexto", () => {
    expect(monthDates(2026, 12)).toHaveLength(31);
    expect(monthDates(2026, 12)[0]).toBe("2026-12-01");
    expect(monthDates(2026, 11).at(-1)).toBe("2026-11-30");
    expect(monthDates(2028, 2).at(-1)).toBe("2028-02-29");
  });
});

describe("getMonthStatus", () => {
  it("dias úteis na janela ficam disponíveis; fim de semana e fora da janela, fechados", () => {
    const s = statusOf(base);
    expect(Object.keys(s)).toHaveLength(31);
    expect(s["2026-12-01"]).toBe("available"); // hoje, terça
    expect(s["2026-12-04"]).toBe("available"); // sexta
    expect(s["2026-12-05"]).toBe("closed"); // sábado
    expect(s["2026-12-06"]).toBe("closed"); // domingo
    expect(s["2026-12-11"]).toBe("available"); // último dia da janela
    expect(s["2026-12-14"]).toBe("closed"); // segunda, fora da janela
  });

  it("dias antes do início da janela ficam fechados", () => {
    const s = statusOf({ ...base, settings: { ...base.settings, minAdvanceDays: 2 } });
    expect(s["2026-12-01"]).toBe("closed");
    expect(s["2026-12-02"]).toBe("closed");
    expect(s["2026-12-03"]).toBe("available");
  });

  it("dia bloqueado por exceção fica fechado", () => {
    const s = statusOf({ ...base, exceptions: [{ date: "2026-12-08", isBlocked: true, start: null, end: null }] });
    expect(s["2026-12-08"]).toBe("closed");
  });

  it("horário especial abre um sábado", () => {
    const s = statusOf({
      ...base,
      exceptions: [{ date: "2026-12-05", isBlocked: false, start: "09:00", end: "12:00" }],
    });
    expect(s["2026-12-05"]).toBe("available");
  });

  it("dia com todos os horários ocupados fica lotado", () => {
    const busy = [
      { start: at("2026-12-02", "08:00"), end: at("2026-12-02", "12:00") },
      { start: at("2026-12-02", "14:00"), end: at("2026-12-02", "18:00") },
    ];
    expect(statusOf({ ...base, busyRanges: busy })["2026-12-02"]).toBe("full");
  });

  it("max_per_day atingido deixa o dia lotado", () => {
    const busy = [{ start: at("2026-12-03", "08:00"), end: at("2026-12-03", "09:00") }];
    const s = statusOf({ ...base, busyRanges: busy, settings: { ...base.settings, maxPerDay: 1 } });
    expect(s["2026-12-03"]).toBe("full");
    expect(s["2026-12-04"]).toBe("available");
  });

  it("hoje sem horário por causa do aviso mínimo fica lotado", () => {
    expect(statusOf({ ...base, now: at(TUESDAY, "17:30") })["2026-12-01"]).toBe("full");
  });

  it("same_day_only: só hoje aparece", () => {
    const days = getMonthStatus({ ...base, settings: { ...base.settings, windowMode: "same_day_only" } });
    expect(days.filter((d) => d.status !== "closed").map((d) => d.date)).toEqual(["2026-12-01"]);
  });

  it("conta os horários de cada dia", () => {
    const day = getMonthStatus(base).find((d) => d.date === "2026-12-02");
    expect(day).toEqual({ date: "2026-12-02", status: "available", slotCount: 8 });
  });
});
