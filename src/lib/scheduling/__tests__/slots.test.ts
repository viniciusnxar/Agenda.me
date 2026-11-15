import { describe, expect, it } from "vitest";

import { generateSlots, type GenerateSlotsInput } from "@/lib/scheduling/slots";
import { toLocalTime } from "@/lib/scheduling/time";
import type { Slot } from "@/lib/scheduling/types";

import { at, settings, TUESDAY, TZ, weekdaysWithLunch } from "./fixtures";

// Por padrão: terça, consultas de 50 min + 10 de buffer, "agora" é segunda à noite
const base: GenerateSlotsInput = {
  date: TUESDAY,
  settings,
  weeklyRules: weekdaysWithLunch,
  exceptions: [],
  busyRanges: [],
  now: at("2026-11-30", "20:00"),
  timezone: TZ,
};

const times = (slots: Slot[]) => slots.map((s) => toLocalTime(s.start, TZ));
const run = (overrides: Partial<GenerateSlotsInput>) => times(generateSlots({ ...base, ...overrides }));

describe("generateSlots", () => {
  it("gera os horários com buffer e pausa para o almoço", () => {
    expect(run({})).toEqual(["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]);
  });

  it("cada slot tem duração e bloqueio até o fim do buffer", () => {
    const [first] = generateSlots(base);
    expect(toLocalTime(first.end, TZ)).toBe("08:50");
    expect(toLocalTime(first.blockedUntil, TZ)).toBe("09:00");
  });

  it("buffer maior muda o passo e não cabe slot que passa do fim do expediente", () => {
    expect(run({ settings: { ...settings, slotDurationMin: 60, bufferMin: 30 } })).toEqual([
      "08:00",
      "09:30",
      "11:00",
      "14:00",
      "15:30",
      "17:00",
    ]);
  });

  it("sem buffer, slots encostados", () => {
    expect(run({ settings: { ...settings, slotDurationMin: 60, bufferMin: 0 } })).toEqual([
      "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("dia sem expediente não tem horários", () => {
    expect(run({ date: "2026-12-06" })).toEqual([]); // domingo
  });

  it("min_notice no mesmo dia remove o que está perto demais", () => {
    // agora 09:30, aviso de 120 min -> só a partir de 11:30
    expect(run({ now: at(TUESDAY, "09:30") })).toEqual(["14:00", "15:00", "16:00", "17:00"]);
    // aviso zero: 10:00 em diante
    expect(run({ now: at(TUESDAY, "09:30"), settings: { ...settings, minNoticeMinutes: 0 } })).toEqual([
      "10:00", "11:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("slot exatamente no limite do aviso é aceito", () => {
    expect(run({ now: at(TUESDAY, "12:00") })[0]).toBe("14:00");
  });

  it("dia que já passou não tem horários", () => {
    expect(run({ now: at("2026-12-02", "08:00") })).toEqual([]);
  });

  it("agendamento existente remove o slot e o buffer dele bloqueia o seguinte", () => {
    // ocupado 09:00–10:00 (50 + 10 de buffer)
    expect(run({ busyRanges: [{ start: at(TUESDAY, "09:00"), end: at(TUESDAY, "10:00") }] })).toEqual([
      "08:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00",
    ]);
    // agendamento manual fora da grade, 10:30–11:20, derruba 10:00 e 11:00
    expect(run({ busyRanges: [{ start: at(TUESDAY, "10:30"), end: at(TUESDAY, "11:20") }] })).toEqual([
      "08:00", "09:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("o buffer do novo slot também não pode invadir um agendamento", () => {
    // ocupado a partir de 08:55: o slot 08:00 terminaria 08:50 mas bloqueia até 09:00
    expect(run({ busyRanges: [{ start: at(TUESDAY, "08:55"), end: at(TUESDAY, "09:05") }] })[0]).toBe("10:00");
  });

  it("max_per_day: dia com o limite atingido fica sem horários", () => {
    const busy = [
      { start: at(TUESDAY, "08:00"), end: at(TUESDAY, "09:00") },
      { start: at(TUESDAY, "14:00"), end: at(TUESDAY, "15:00") },
    ];
    expect(run({ busyRanges: busy, settings: { ...settings, maxPerDay: 2 } })).toEqual([]);
    expect(run({ busyRanges: busy, settings: { ...settings, maxPerDay: 3 } })).toEqual([
      "09:00", "10:00", "11:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("max_per_day conta só agendamentos do próprio dia", () => {
    const otherDay = [{ start: at("2026-12-02", "08:00"), end: at("2026-12-02", "09:00") }];
    expect(run({ busyRanges: otherDay, settings: { ...settings, maxPerDay: 1 } })).toHaveLength(8);
  });

  it("exceção de dia bloqueado zera o dia", () => {
    expect(run({ exceptions: [{ date: TUESDAY, isBlocked: true, start: null, end: null }] })).toEqual([]);
  });

  it("exceção de outro dia não interfere", () => {
    expect(run({ exceptions: [{ date: "2026-12-02", isBlocked: true, start: null, end: null }] })).toHaveLength(8);
  });

  it("horário especial substitui as regras semanais", () => {
    expect(
      run({
        exceptions: [
          { date: TUESDAY, isBlocked: false, start: "15:00", end: "17:00" },
          { date: TUESDAY, isBlocked: false, start: "09:00", end: "10:00" },
        ],
      }),
    ).toEqual(["09:00", "15:00", "16:00"]);
  });

  it("horário especial abre um dia sem expediente", () => {
    expect(run({ date: "2026-12-06", exceptions: [{ date: "2026-12-06", isBlocked: false, start: "09:00", end: "11:00" }] })).toEqual([
      "09:00",
      "10:00",
    ]);
  });

  it("virada de dia em UTC: 21h em Fortaleza é o dia seguinte em UTC", () => {
    const slots = generateSlots({ ...base, weeklyRules: [{ weekday: 2, start: "19:00", end: "23:00" }] });
    expect(times(slots)).toEqual(["19:00", "20:00", "21:00", "22:00"]);
    expect(slots[2].start.toISOString()).toBe("2026-12-02T00:00:00.000Z");
  });

  it("virada de dia em UTC: max_per_day conta pelo dia local", () => {
    // agendamento às 21h de terça (quarta em UTC) conta para terça
    const busy = [{ start: at(TUESDAY, "21:00"), end: at(TUESDAY, "22:00") }];
    expect(run({ busyRanges: busy, settings: { ...settings, maxPerDay: 1 } })).toEqual([]);
    expect(run({ date: "2026-12-02", busyRanges: busy, settings: { ...settings, maxPerDay: 1 } })).toHaveLength(8);
  });
});
