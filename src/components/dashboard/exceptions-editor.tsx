"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addException, deleteException } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLong } from "@/lib/format";

export type ExceptionRow = {
  id: string;
  date: string;
  is_blocked: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

// "2026-12-25" ao meio-dia UTC: a data não muda em nenhum fuso do Brasil
const longDate = (date: string) => formatDateLong(`${date}T12:00:00Z`, "UTC");

export function ExceptionsEditor({ exceptions, today }: { exceptions: ExceptionRow[]; today: string }) {
  const [form, setForm] = useState({ date: "", type: "blocked", start_time: "08:00", end_time: "12:00", reason: "" });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();
  const [saving, startSaving] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const input =
      form.type === "blocked"
        ? { is_blocked: true as const, date: form.date, reason: form.reason }
        : { is_blocked: false as const, date: form.date, start_time: form.start_time, end_time: form.end_time, reason: form.reason };
    startSaving(async () => {
      const result = await addException(input);
      if (result.ok) {
        setErrors(undefined);
        setForm((f) => ({ ...f, date: "", reason: "" }));
        toast.success("Exceção adicionada");
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  async function remove(id: string) {
    setRemoving(id);
    const result = await deleteException(id);
    setRemoving(null);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={add} className="grid gap-4 rounded-lg border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="exception-date">Data</Label>
            <Input
              id="exception-date"
              type="date"
              min={today}
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              aria-invalid={errors?.date ? true : undefined}
            />
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Tipo</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="type" checked={form.type === "blocked"} onChange={() => set("type", "blocked")} />
                Dia bloqueado
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" checked={form.type === "special"} onChange={() => set("type", "special")} />
                Horário especial
              </label>
            </div>
          </fieldset>
        </div>

        {form.type === "special" && (
          <div className="flex items-end gap-2">
            <div className="grid gap-2">
              <Label htmlFor="exception-start">Das</Label>
              <Input
                id="exception-start"
                type="time"
                step={300}
                className="w-28"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exception-end">Até</Label>
              <Input
                id="exception-end"
                type="time"
                step={300}
                className="w-28"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
                aria-invalid={errors?.end_time ? true : undefined}
              />
            </div>
          </div>
        )}
        {errors?.end_time && <p className="text-sm text-destructive">{errors.end_time[0]}</p>}

        <div className="grid gap-2">
          <Label htmlFor="exception-reason">Motivo (opcional, só você vê)</Label>
          <Input
            id="exception-reason"
            maxLength={200}
            placeholder="Férias, feriado, congresso..."
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
          />
        </div>

        <Button type="submit" disabled={saving} className="justify-self-start">
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          Adicionar
        </Button>
      </form>

      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma exceção futura.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {exceptions.map((ex) => (
            <li key={ex.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium first-letter:uppercase">{longDate(ex.date)}</p>
                <p className="text-sm text-muted-foreground">
                  {ex.is_blocked ? "Dia bloqueado" : `Horário especial: ${ex.start_time?.slice(0, 5)} às ${ex.end_time?.slice(0, 5)}`}
                  {ex.reason && ` · ${ex.reason}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(ex.id)}
                disabled={removing === ex.id}
                aria-label={`Remover exceção de ${longDate(ex.date)}`}
              >
                {removing === ex.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
