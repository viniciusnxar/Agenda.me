"use client";

import { Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatCpf, formatPhone } from "@/lib/format";
import { PRIVATE_PLAN } from "@/lib/validation/schemas";

export type BookingFormValues = {
  client_name: string;
  client_phone: string;
  client_cpf: string;
  plan_id: string;
  notes: string;
  consent: boolean;
  website: string;
};

export type BookingFormOptions = {
  requireCpf: boolean;
  plansEnabled: boolean;
  requirePlan: boolean;
  allowPrivate: boolean;
  plans: { id: string; name: string }[];
  whatsappAvailable: boolean;
};

type BookingFormProps = {
  options: BookingFormOptions;
  pending: "booking" | "whatsapp" | null;
  error: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
  onSubmit: (values: BookingFormValues, source: "booking" | "whatsapp") => void;
};

export function BookingForm({ options, pending, error, fieldErrors, onSubmit }: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>({
    client_name: "",
    client_phone: "",
    client_cpf: "",
    plan_id: "",
    notes: "",
    consent: false,
    website: "",
  });
  const set = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const busy = pending !== null;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values, "booking");
      }}
    >
      <FormField
        label="Nome completo"
        name="client_name"
        autoComplete="name"
        required
        value={values.client_name}
        onChange={(e) => set("client_name", e.target.value)}
        errors={fieldErrors?.client_name}
      />
      <FormField
        label="Telefone (WhatsApp)"
        name="client_phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(85) 99999-0000"
        required
        value={values.client_phone}
        onChange={(e) => set("client_phone", formatPhone(e.target.value))}
        errors={fieldErrors?.client_phone}
      />
      {options.requireCpf && (
        <FormField
          label="CPF"
          name="client_cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          required
          value={values.client_cpf}
          onChange={(e) => set("client_cpf", formatCpf(e.target.value))}
          errors={fieldErrors?.client_cpf}
        />
      )}

      {options.plansEnabled && (
        <div className="grid gap-2">
          <Label htmlFor="plan_id">Plano ou convênio</Label>
          <NativeSelect
            id="plan_id"
            name="plan_id"
            className="w-full"
            required={options.requirePlan}
            value={values.plan_id}
            onChange={(e) => set("plan_id", e.target.value)}
            aria-invalid={fieldErrors?.plan_id ? true : undefined}
          >
            <NativeSelectOption value="">{options.requirePlan ? "Selecione" : "Não informar"}</NativeSelectOption>
            {options.allowPrivate && <NativeSelectOption value={PRIVATE_PLAN}>Particular</NativeSelectOption>}
            {options.plans.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {fieldErrors?.plan_id && <p className="text-sm text-destructive">{fieldErrors.plan_id[0]}</p>}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={500}
          rows={3}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* honeypot: invisível para pessoas, robôs costumam preencher */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Não preencha</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <div className="grid gap-1">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={values.consent}
            onCheckedChange={(c) => set("consent", c === true)}
            aria-invalid={fieldErrors?.consent ? true : undefined}
            className="mt-0.5"
          />
          <Label htmlFor="consent" className="leading-snug font-normal">
            <span>
              Concordo com o uso dos meus dados para agendamento (
              <Link href="/privacidade" target="_blank" className="underline underline-offset-4">
                política de privacidade
              </Link>
              ).
            </span>
          </Label>
        </div>
        {fieldErrors?.consent && <p className="text-sm text-destructive">{fieldErrors.consent[0]}</p>}
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Button type="submit" size="lg" disabled={busy || !values.consent}>
          {pending === "booking" && <Loader2 className="animate-spin" aria-hidden="true" />}
          Confirmar agendamento
        </Button>
        {options.whatsappAvailable && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={busy || !values.consent}
            onClick={() => onSubmit(values, "whatsapp")}
          >
            {pending === "whatsapp" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
            Solicitar via WhatsApp
          </Button>
        )}
      </div>
    </form>
  );
}
