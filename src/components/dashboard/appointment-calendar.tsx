"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { AppointmentDetailsData } from "@/components/dashboard/appointment-details";
import { AppointmentDrawer } from "@/components/dashboard/appointment-drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarAppointment = AppointmentDetailsData & {
  /** data local "YYYY-MM-DD" */
  date: string;
  /** hora local "HH:mm" */
  time: string;
};

export type CalendarDayCell = {
  date: string;
  label: string;
  inMonth: boolean;
  isToday: boolean;
};

type AppointmentCalendarProps = {
  view: "week" | "month";
  title: string;
  days: CalendarDayCell[];
  appointments: CalendarAppointment[];
  links: { prev: string; next: string; today: string; week: string; month: string };
};

const STATUS_CHIP: Record<string, string> = {
  pending: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/40",
  confirmed: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
  completed: "border-l-sky-500 bg-sky-50 dark:bg-sky-950/40",
  no_show: "border-l-neutral-400 bg-neutral-100 dark:bg-neutral-800",
  cancelled: "border-l-red-400 bg-red-50 line-through opacity-70 dark:bg-red-950/40",
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function AppointmentCalendar({ view, title, days, appointments: initial, links }: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = appointments.find((a) => a.id === selectedId) ?? null;

  const byDate = new Map<string, CalendarAppointment[]>();
  for (const a of appointments) byDate.set(a.date, [...(byDate.get(a.date) ?? []), a]);

  const maxChips = view === "month" ? 3 : Infinity;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={links.prev} aria-label="Anterior">
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={links.next} aria-label="Próximo">
              <ChevronRight />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={links.today}>Hoje</Link>
          </Button>
          <h2 className="ml-2 font-semibold first-letter:uppercase">{title}</h2>
        </div>
        <div className="flex rounded-md border p-0.5" role="group" aria-label="Visualização">
          <Button variant={view === "week" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={links.week} aria-current={view === "week" ? "page" : undefined}>
              Semana
            </Link>
          </Button>
          <Button variant={view === "month" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={links.month} aria-current={view === "month" ? "page" : undefined}>
              Mês
            </Link>
          </Button>
        </div>
      </div>

      <div className="hidden grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground md:grid" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <ol
        className={cn(
          "grid gap-px overflow-hidden rounded-lg border bg-border",
          view === "week" ? "md:grid-cols-7" : "grid-cols-7",
        )}
      >
        {days.map((day) => {
          const items = byDate.get(day.date) ?? [];
          const hidden = items.length - Math.min(items.length, maxChips);
          return (
            <li
              key={day.date}
              className={cn(
                "flex flex-col gap-1 bg-background p-1.5",
                view === "week" ? "min-h-32 md:min-h-96" : "min-h-20 md:min-h-28",
                !day.inMonth && "bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "self-start rounded-full px-1.5 text-xs font-medium",
                  day.isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.label}
              </span>
              {items.slice(0, maxChips).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    "rounded border-l-4 px-1.5 py-1 text-left text-xs transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    STATUS_CHIP[a.status],
                  )}
                  aria-label={`${a.time}, ${a.client_name}`}
                >
                  <span className="font-semibold tabular-nums">{a.time}</span>{" "}
                  <span className={cn("truncate", view === "month" && "hidden md:inline")}>{a.client_name}</span>
                </button>
              ))}
              {hidden > 0 && <span className="px-1 text-xs text-muted-foreground">+{hidden}</span>}
            </li>
          );
        })}
      </ol>

      <AppointmentDrawer
        appointment={selected}
        onClose={() => setSelectedId(null)}
        onChanged={(id, status) => setAppointments((as) => as.map((a) => (a.id === id ? { ...a, status } : a)))}
      />
    </div>
  );
}
