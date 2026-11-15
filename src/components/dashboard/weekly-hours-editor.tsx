"use client";

import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveWeeklyRules } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { WeeklyRuleInput } from "@/lib/validation/schemas";

// segunda primeiro, como as pessoas pensam a semana; weekday segue o banco (0 = domingo)
const DAYS = [
  { weekday: 1, label: "Segunda" },
  { weekday: 2, label: "Terça" },
  { weekday: 3, label: "Quarta" },
  { weekday: 4, label: "Quinta" },
  { weekday: 5, label: "Sexta" },
  { weekday: 6, label: "Sábado" },
  { weekday: 0, label: "Domingo" },
];

type Interval = { key: string; start_time: string; end_time: string };
type Week = Record<number, Interval[]>;

const newInterval = (start = "08:00", end = "12:00"): Interval => ({ key: crypto.randomUUID(), start_time: start, end_time: end });

export function WeeklyHoursEditor({ rules }: { rules: WeeklyRuleInput[] }) {
  const [week, setWeek] = useState<Week>(() => {
    const w: Week = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const r of [...rules].sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      w[r.weekday].push(newInterval(r.start_time, r.end_time));
    }
    return w;
  });
  const [saving, startSaving] = useTransition();

  const setDay = (weekday: number, intervals: Interval[]) => setWeek((w) => ({ ...w, [weekday]: intervals }));

  function toggleDay(weekday: number, on: boolean) {
    setDay(weekday, on ? [newInterval("08:00", "12:00"), newInterval("14:00", "18:00")] : []);
  }

  function updateInterval(weekday: number, key: string, patch: Partial<Interval>) {
    setDay(
      weekday,
      week[weekday].map((i) => (i.key === key ? { ...i, ...patch } : i)),
    );
  }

  function copyToWeekdays(from: number) {
    setWeek((w) => {
      const next = { ...w };
      for (const d of [1, 2, 3, 4, 5]) {
        if (d !== from) next[d] = w[from].map((i) => newInterval(i.start_time, i.end_time));
      }
      return next;
    });
    toast.info("Copiado para segunda a sexta. Não esqueça de salvar.");
  }

  function save() {
    const payload = DAYS.flatMap(({ weekday }) =>
      week[weekday].map((i) => ({ weekday, start_time: i.start_time, end_time: i.end_time })),
    );
    startSaving(async () => {
      const result = await saveWeeklyRules(payload);
      if (result.ok) toast.success("Horários salvos");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y rounded-lg border">
        {DAYS.map(({ weekday, label }) => {
          const intervals = week[weekday];
          const open = intervals.length > 0;
          return (
            <li key={weekday} className="grid gap-3 p-3 sm:grid-cols-[9rem_1fr] sm:items-start">
              <div className="flex items-center gap-3 sm:pt-1.5">
                <Switch
                  id={`day-${weekday}`}
                  checked={open}
                  onCheckedChange={(v) => toggleDay(weekday, v)}
                  aria-label={`Atende ${label.toLowerCase()}`}
                />
                <label htmlFor={`day-${weekday}`} className="text-sm font-medium">
                  {label}
                </label>
              </div>

              {open ? (
                <div className="grid gap-2">
                  {intervals.map((interval, idx) => (
                    <div key={interval.key} className="flex items-center gap-2">
                      <Input
                        type="time"
                        step={300}
                        className="w-28"
                        value={interval.start_time}
                        onChange={(e) => updateInterval(weekday, interval.key, { start_time: e.target.value })}
                        aria-label={`${label}, início do intervalo ${idx + 1}`}
                      />
                      <span className="text-sm text-muted-foreground">até</span>
                      <Input
                        type="time"
                        step={300}
                        className="w-28"
                        value={interval.end_time}
                        onChange={(e) => updateInterval(weekday, interval.key, { end_time: e.target.value })}
                        aria-label={`${label}, fim do intervalo ${idx + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDay(weekday, intervals.filter((i) => i.key !== interval.key))}
                        aria-label={`Remover intervalo ${idx + 1} de ${label.toLowerCase()}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDay(weekday, [...intervals, newInterval("14:00", "18:00")])}
                    >
                      <Plus aria-hidden="true" /> Intervalo
                    </Button>
                    {weekday >= 1 && weekday <= 5 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => copyToWeekdays(weekday)}>
                        <Copy aria-hidden="true" /> Copiar para dias úteis
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground sm:pt-2">Não atende</p>
              )}
            </li>
          );
        })}
      </ul>
      <Button type="button" onClick={save} disabled={saving} className="justify-self-start">
        {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
        Salvar horários
      </Button>
    </div>
  );
}
