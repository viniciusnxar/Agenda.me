"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateBookingSettings } from "@/app/dashboard/actions";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BookingSettingsData } from "@/lib/validation/schemas";
import { WINDOW_MODES } from "@/lib/validation/schemas";

const WINDOW_LABELS: Record<(typeof WINDOW_MODES)[number], { title: string; text: string }> = {
  flexible: { title: "Flexível", text: "De X a Y dias à frente." },
  same_day_only: { title: "Só no mesmo dia", text: "O paciente só agenda para hoje." },
  next_day_only: { title: "Só para o dia seguinte", text: "O paciente só agenda para amanhã." },
};

type BoolKey = {
  [K in keyof BookingSettingsData]: BookingSettingsData[K] extends boolean ? K : never;
}[keyof BookingSettingsData];

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export function RulesEditor({ settings, hasWhatsapp }: { settings: BookingSettingsData; hasWhatsapp: boolean }) {
  // números ficam como texto enquanto a pessoa digita; o zod converte no servidor
  const [form, setForm] = useState({
    ...settings,
    slot_duration_min: String(settings.slot_duration_min),
    buffer_min: String(settings.buffer_min),
    min_advance_days: String(settings.min_advance_days),
    max_advance_days: String(settings.max_advance_days),
    min_notice_minutes: String(settings.min_notice_minutes),
    max_per_day: settings.max_per_day === null ? "" : String(settings.max_per_day),
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();
  const [saving, startSaving] = useTransition();

  const setText = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: BoolKey) => (value: boolean) => setForm((f) => ({ ...f, [key]: value }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    startSaving(async () => {
      const result = await updateBookingSettings(form);
      if (result.ok) {
        setErrors(undefined);
        toast.success("Regras salvas");
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  const number = (key: keyof typeof form, label: string, hint?: string, placeholder?: string) => (
    <FormField
      label={label}
      name={key}
      type="number"
      inputMode="numeric"
      min={0}
      hint={hint}
      placeholder={placeholder}
      value={form[key] as string}
      onChange={(e) => setText(key, e.target.value)}
      errors={errors?.[key]}
    />
  );

  return (
    <form onSubmit={save} className="grid gap-6">
      <Card>
        <CardContent className="pt-6">
          <Toggle
            id="is_enabled"
            label="Agendamento online"
            description="Mostra o botão Agendar na sua página."
            checked={form.is_enabled}
            onChange={toggle("is_enabled")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consulta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {number("slot_duration_min", "Duração (minutos)")}
          {number("buffer_min", "Intervalo entre consultas (minutos)", "Tempo livre depois de cada atendimento.")}
          {number("max_per_day", "Limite por dia", "Deixe vazio para não limitar.", "Sem limite")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quando o paciente pode agendar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Janela de dias</legend>
            {WINDOW_MODES.map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/50"
              >
                <input
                  type="radio"
                  name="window_mode"
                  value={mode}
                  checked={form.window_mode === mode}
                  onChange={() => setForm((f) => ({ ...f, window_mode: mode }))}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">{WINDOW_LABELS[mode].title}</span>
                  <span className="block text-sm text-muted-foreground">{WINDOW_LABELS[mode].text}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            {form.window_mode === "flexible" && (
              <>
                {number("min_advance_days", "Antecedência mínima (dias)", "0 permite agendar para hoje.")}
                {number("max_advance_days", "Agenda aberta até (dias)")}
              </>
            )}
            {number("min_notice_minutes", "Aviso mínimo (minutos)", "Ex.: 120 = não aceita horários a menos de 2h.")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirmação e dados do paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Toggle
            id="auto_confirm"
            label="Confirmar automaticamente"
            description="Desligado, o agendamento entra como pendente até você confirmar."
            checked={form.auto_confirm}
            onChange={toggle("auto_confirm")}
          />
          <Toggle id="require_cpf" label="Pedir CPF" checked={form.require_cpf} onChange={toggle("require_cpf")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planos e convênios</CardTitle>
          <CardDescription>
            Cadastre os planos em{" "}
            <Link href="/dashboard/planos" className="underline underline-offset-4">
              Planos
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Toggle
            id="plans_enabled"
            label="Perguntar o plano"
            checked={form.plans_enabled}
            onChange={toggle("plans_enabled")}
          />
          <Toggle
            id="require_plan"
            label="Plano obrigatório"
            checked={form.require_plan}
            onChange={toggle("require_plan")}
            disabled={!form.plans_enabled}
          />
          <Toggle
            id="allow_private"
            label='Incluir a opção "Particular"'
            checked={form.allow_private}
            onChange={toggle("allow_private")}
            disabled={!form.plans_enabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!hasWhatsapp && (
            <Alert>
              <AlertDescription>
                Cadastre seu WhatsApp em{" "}
                <Link href="/dashboard/pagina" className="underline underline-offset-4">
                  Minha página
                </Link>{" "}
                para o botão aparecer.
              </AlertDescription>
            </Alert>
          )}
          <Toggle
            id="whatsapp_enabled"
            label='Botão "Solicitar via WhatsApp"'
            checked={form.whatsapp_enabled}
            onChange={toggle("whatsapp_enabled")}
          />
          <Toggle
            id="whatsapp_hold_slot"
            label="Reservar o horário"
            description="O pedido pelo WhatsApp já segura o horário como pendente."
            checked={form.whatsapp_hold_slot}
            onChange={toggle("whatsapp_hold_slot")}
            disabled={!form.whatsapp_enabled}
          />
          <div className="grid gap-2">
            <Label htmlFor="whatsapp_message_template">Mensagem</Label>
            <Textarea
              id="whatsapp_message_template"
              rows={3}
              maxLength={500}
              value={form.whatsapp_message_template}
              onChange={(e) => setText("whatsapp_message_template", e.target.value)}
              disabled={!form.whatsapp_enabled}
              aria-describedby="template-hint"
            />
            <p id="template-hint" className="text-sm text-muted-foreground">
              Variáveis: {"{nome}"} {"{data}"} {"{hora}"} {"{plano}"}
            </p>
            {errors?.whatsapp_message_template && (
              <p className="text-sm text-destructive">{errors.whatsapp_message_template[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="justify-self-start">
        {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
        Salvar regras
      </Button>
    </form>
  );
}
