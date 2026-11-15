"use client";

import { Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createManualAppointment } from "@/app/dashboard/actions";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatCpf, formatPhone } from "@/lib/format";
import { PRIVATE_PLAN } from "@/lib/validation/schemas";

type Props = {
  defaultDate: string;
  defaultDuration: number;
  plans: { id: string; name: string }[];
};

export function ManualAppointmentDialog({ defaultDate, defaultDuration, plans }: Props) {
  const empty = {
    date: defaultDate,
    time: "09:00",
    duration_min: String(defaultDuration),
    client_name: "",
    client_phone: "",
    client_cpf: "",
    plan_id: "",
    notes: "",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createManualAppointment(form);
      if (result.ok) {
        toast.success("Agendamento criado");
        setForm(empty);
        setErrors(undefined);
        setOpen(false);
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" /> Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Entra como confirmado. Pode ser fora dos seus horários de atendimento.</DialogDescription>
        </DialogHeader>
        <form id="manual-appointment" onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label="Data"
              name="date"
              type="date"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              errors={errors?.date}
            />
            <FormField
              label="Hora"
              name="time"
              type="time"
              step={300}
              required
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              errors={errors?.time}
            />
            <FormField
              label="Duração (min)"
              name="duration_min"
              type="number"
              min={5}
              max={480}
              required
              value={form.duration_min}
              onChange={(e) => set("duration_min", e.target.value)}
              errors={errors?.duration_min}
            />
          </div>
          <FormField
            label="Nome do paciente"
            name="client_name"
            required
            value={form.client_name}
            onChange={(e) => set("client_name", e.target.value)}
            errors={errors?.client_name}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="Telefone"
              name="client_phone"
              type="tel"
              inputMode="tel"
              required
              placeholder="(85) 99999-0000"
              value={form.client_phone}
              onChange={(e) => set("client_phone", formatPhone(e.target.value))}
              errors={errors?.client_phone}
            />
            <FormField
              label="CPF (opcional)"
              name="client_cpf"
              inputMode="numeric"
              value={form.client_cpf}
              onChange={(e) => set("client_cpf", formatCpf(e.target.value))}
              errors={errors?.client_cpf}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manual-plan">Plano</Label>
            <NativeSelect
              id="manual-plan"
              className="w-full"
              value={form.plan_id}
              onChange={(e) => set("plan_id", e.target.value)}
            >
              <NativeSelectOption value="">Não informado</NativeSelectOption>
              <NativeSelectOption value={PRIVATE_PLAN}>Particular</NativeSelectOption>
              {plans.map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>
                  {p.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manual-notes">Observações</Label>
            <Textarea
              id="manual-notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="manual-appointment" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
