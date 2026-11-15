"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createAppointment, getCalendar, getSlots, type SlotOption } from "@/app/[username]/agendar/actions";
import { BookingCalendar } from "@/components/public/booking-calendar";
import { BookingForm, type BookingFormOptions, type BookingFormValues } from "@/components/public/booking-form";
import { SlotPicker } from "@/components/public/slot-picker";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateLong } from "@/lib/format";
import { zonedToUtc, type CalendarDay, type LocalDate } from "@/lib/scheduling";
import { PRIVATE_PLAN } from "@/lib/validation/schemas";
import { buildWhatsAppLink, fillTemplate } from "@/lib/whatsapp";

type BookingFlowProps = {
  username: string;
  timezone: string;
  initial: { year: number; month: number; days: CalendarDay[] };
  /** primeiro e último mês com dias na janela, "YYYY-MM" */
  monthRange: { first: string; last: string };
  formOptions: BookingFormOptions;
  whatsapp: { phone: string; template: string; holdSlot: boolean } | null;
};

const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export function BookingFlow({ username, timezone, initial, monthRange, formOptions, whatsapp }: BookingFlowProps) {
  const router = useRouter();
  const [calendar, setCalendar] = useState(initial);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [loadingMonth, startMonth] = useTransition();

  const [date, setDate] = useState<LocalDate | null>(null);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, startSlots] = useTransition();
  const [slot, setSlot] = useState<SlotOption | null>(null);

  const [pending, setPending] = useState<"booking" | "whatsapp" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>();

  const current = monthKey(calendar.year, calendar.month);

  function changeMonth(delta: number) {
    const d = new Date(Date.UTC(calendar.year, calendar.month - 1 + delta, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    startMonth(async () => {
      const result = await getCalendar(username, year, month);
      if (result.ok) {
        setCalendar({ year, month, days: result.data });
        setCalendarError(null);
      } else {
        setCalendarError(result.error);
      }
    });
  }

  function selectDate(value: LocalDate) {
    setDate(value);
    setSlot(null);
    setSlots([]);
    setSlotsError(null);
    startSlots(async () => {
      const result = await getSlots(username, value);
      if (result.ok) setSlots(result.data);
      else setSlotsError(result.error);
    });
  }

  async function submit(values: BookingFormValues, source: "booking" | "whatsapp") {
    if (!slot || !date) return;
    setPending(source);
    setError(null);
    setFieldErrors(undefined);

    // WhatsApp sem reserva: só abre a conversa, nada é gravado
    if (source === "whatsapp" && whatsapp && !whatsapp.holdSlot) {
      window.open(whatsAppLink(values), "_blank", "noopener,noreferrer");
      setPending(null);
      return;
    }

    // a aba do WhatsApp precisa abrir ainda dentro do clique, senão o navegador bloqueia o pop-up
    const popup = source === "whatsapp" ? window.open("about:blank", "_blank") : null;
    if (popup) popup.opener = null;

    const result = await createAppointment(username, { ...values, starts_at: slot.start, source });
    setPending(null);

    if (!result.ok) {
      popup?.close();
      setError(result.fieldErrors ? "Confira os campos destacados." : result.error);
      setFieldErrors(result.fieldErrors);
      if (/reservado|não está mais disponível/.test(result.error)) selectDate(date); // atualiza os horários
      return;
    }

    if (popup) popup.location.href = whatsAppLink(values);
    router.push(`/${username}/agendar/sucesso?t=${encodeURIComponent(result.data.token)}`);
  }

  function whatsAppLink(values: BookingFormValues): string {
    const plan =
      values.plan_id === PRIVATE_PLAN
        ? "Particular"
        : (formOptions.plans.find((p) => p.id === values.plan_id)?.name ?? "Não informado");
    const message = fillTemplate(whatsapp!.template, {
      nome: values.client_name,
      data: formatDate(slot!.start, timezone),
      hora: slot!.label,
      plano: plan,
    });
    return buildWhatsAppLink(whatsapp!.phone, message);
  }

  if (slot && date) {
    return (
      <section className="grid gap-4" aria-labelledby="form-title">
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setSlot(null)}>
          <ArrowLeft aria-hidden="true" /> Trocar horário
        </Button>
        <div className="rounded-lg border bg-muted/40 p-3 text-center">
          <p id="form-title" className="text-sm text-muted-foreground">
            Seu horário
          </p>
          <p className="font-semibold first-letter:uppercase">
            {formatDateLong(zonedToUtc(date, "12:00", timezone), timezone)} às {slot.label}
          </p>
        </div>
        <BookingForm
          options={formOptions}
          pending={pending}
          error={error}
          fieldErrors={fieldErrors}
          onSubmit={submit}
        />
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <BookingCalendar
        year={calendar.year}
        month={calendar.month}
        days={calendar.days}
        selected={date}
        onSelect={selectDate}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        canPrev={current > monthRange.first}
        canNext={current < monthRange.last}
        loading={loadingMonth}
      />
      {calendarError && <p className="text-center text-sm text-destructive">{calendarError}</p>}

      {date && (
        <section className="grid gap-3" aria-labelledby="slots-title">
          <h2 id="slots-title" className="text-center font-semibold first-letter:uppercase">
            {formatDateLong(zonedToUtc(date, "12:00", timezone), timezone)}
          </h2>
          {slotsError ? (
            <p className="text-center text-sm text-destructive">{slotsError}</p>
          ) : (
            <SlotPicker slots={slots} selected={null} onSelect={setSlot} loading={loadingSlots} />
          )}
        </section>
      )}
    </div>
  );
}
