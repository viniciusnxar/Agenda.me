import { generateSlots, getDayIntervals, type GenerateSlotsInput } from "@/lib/scheduling/slots";
import type { DayStatus, LocalDate } from "@/lib/scheduling/types";
import { getBookingWindow, isInWindow } from "@/lib/scheduling/window";

export type CalendarDay = {
  date: LocalDate;
  status: DayStatus;
  slotCount: number;
};

export type MonthStatusInput = Omit<GenerateSlotsInput, "date"> & {
  year: number;
  /** 1 = janeiro ... 12 = dezembro */
  month: number;
};

/** Todos os dias do mês como "YYYY-MM-DD". */
export function monthDates(year: number, month: number): LocalDate[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return Array.from({ length: days }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

/**
 * Status de cada dia do mês para o calendário do cliente:
 * - closed: fora da janela, sem expediente ou bloqueado
 * - full: tinha expediente, mas nenhum horário sobrou
 * - available: tem pelo menos um horário
 */
export function getMonthStatus({ year, month, ...input }: MonthStatusInput): CalendarDay[] {
  const window = getBookingWindow(input.settings, input.now, input.timezone);

  return monthDates(year, month).map((date) => {
    if (!isInWindow(date, window)) return { date, status: "closed", slotCount: 0 };

    const intervals = getDayIntervals(date, input.weeklyRules, input.exceptions);
    if (!intervals || intervals.length === 0) return { date, status: "closed", slotCount: 0 };

    const slotCount = generateSlots({ ...input, date }).length;
    return { date, status: slotCount > 0 ? "available" : "full", slotCount };
  });
}
