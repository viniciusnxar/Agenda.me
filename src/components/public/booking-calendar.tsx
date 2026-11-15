"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarDay, DayStatus, LocalDate } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const STATUS_LABEL: Record<DayStatus, string> = {
  available: "disponível",
  full: "lotado",
  closed: "fechado",
};

const STATUS_CLASS: Record<DayStatus, string> = {
  available: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100",
  full: "bg-amber-100 text-amber-900 line-through dark:bg-amber-900/40 dark:text-amber-100",
  closed: "text-muted-foreground/50",
};

type BookingCalendarProps = {
  year: number;
  month: number;
  days: CalendarDay[];
  selected: LocalDate | null;
  onSelect: (date: LocalDate) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
};

export function BookingCalendar({
  year,
  month,
  days,
  selected,
  onSelect,
  onPrev,
  onNext,
  canPrev,
  canNext,
  loading,
}: BookingCalendarProps) {
  // dias vazios antes do dia 1 para alinhar com o dia da semana
  const offset = days.length ? new Date(`${days[0].date}T12:00:00Z`).getUTCDay() : 0;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev} disabled={!canPrev || loading} aria-label="Mês anterior">
          <ChevronLeft />
        </Button>
        <h2 className="flex items-center gap-2 font-semibold capitalize" aria-live="polite">
          {MONTHS[month - 1]} de {year}
          {loading && <Loader2 className="size-4 animate-spin" aria-label="Carregando" />}
        </h2>
        <Button variant="ghost" size="icon" onClick={onNext} disabled={!canNext || loading} aria-label="Próximo mês">
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7 gap-1", loading && "opacity-50")} role="group" aria-label="Dias do mês">
        {Array.from({ length: offset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dayNumber = Number(day.date.slice(8));
          const isSelected = day.date === selected;
          return (
            <button
              key={day.date}
              type="button"
              disabled={day.status !== "available" || loading}
              onClick={() => onSelect(day.date)}
              aria-pressed={isSelected}
              aria-label={`${dayNumber} de ${MONTHS[month - 1]}, ${STATUS_LABEL[day.status]}`}
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed",
                STATUS_CLASS[day.status],
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-emerald-200" aria-hidden="true" /> Disponível
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-200" aria-hidden="true" /> Lotado
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border" aria-hidden="true" /> Fechado
        </li>
      </ul>
    </div>
  );
}
