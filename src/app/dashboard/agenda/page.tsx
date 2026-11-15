import type { Metadata } from "next";

import { AppointmentCalendar, type CalendarAppointment } from "@/components/dashboard/appointment-calendar";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireProfile } from "@/lib/auth";
import { formatDateLong, maskCpf } from "@/lib/format";
import { addDays, diffDays, monthDates, toLocalDate, toLocalTime, weekdayOf } from "@/lib/scheduling";
import { localDaysRange } from "@/lib/scheduling-data";

export const metadata: Metadata = { title: "Agenda" };

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

type Props = { searchParams: Promise<{ view?: string; date?: string }> };

/** Segunda-feira da semana da data. */
const mondayOf = (date: string) => addDays(date, -((weekdayOf(date) + 6) % 7));

export default async function AgendaPage({ searchParams }: Props) {
  const { profile, supabase } = await requireProfile();
  const tz = profile.timezone;
  const params = await searchParams;

  const view = params.view === "month" ? "month" : "week";
  const today = toLocalDate(new Date(), tz);
  const anchor = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const [year, month] = anchor.split("-").map(Number);

  // dias exibidos: a semana (seg–dom) ou as semanas completas que cobrem o mês
  let first: string;
  let last: string;
  if (view === "week") {
    first = mondayOf(anchor);
    last = addDays(first, 6);
  } else {
    const dates = monthDates(year, month);
    first = mondayOf(dates[0]);
    last = addDays(mondayOf(dates.at(-1)!), 6);
  }
  const days = Array.from({ length: diffDays(first, last) + 1 }, (_, i) => {
    const date = addDays(first, i);
    return {
      date,
      label: view === "week" ? `${date.slice(8)}/${date.slice(5, 7)}` : String(Number(date.slice(8))),
      inMonth: view === "week" || date.slice(0, 7) === anchor.slice(0, 7),
      isToday: date === today,
    };
  });

  const { from, to } = localDaysRange(first, last, tz);
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, source, client_name, client_phone, client_cpf, plan_name, notes")
    .eq("profile_id", profile.id)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");

  // CPF sai daqui já mascarado: o número completo nunca vai para a agenda (LGPD)
  const appointments: CalendarAppointment[] = (data ?? []).map((a) => ({
    id: a.id,
    status: a.status,
    source: a.source,
    client_name: a.client_name,
    client_phone: a.client_phone,
    cpf: a.client_cpf ? maskCpf(a.client_cpf) : null,
    plan_name: a.plan_name,
    notes: a.notes,
    date: toLocalDate(new Date(a.starts_at), tz),
    time: toLocalTime(new Date(a.starts_at), tz),
    dateLabel: formatDateLong(a.starts_at, tz),
    timeLabel: `${toLocalTime(new Date(a.starts_at), tz)} às ${toLocalTime(new Date(a.ends_at), tz)}`,
  }));

  const step = view === "week" ? 7 : 0;
  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    return d.toISOString().slice(0, 10);
  };
  const href = (v: string, date: string) => `/dashboard/agenda?view=${v}&date=${date}`;

  const title =
    view === "week"
      ? `${first.slice(8)}/${first.slice(5, 7)} a ${last.slice(8)}/${last.slice(5, 7)} de ${last.slice(0, 4)}`
      : `${MONTHS[month - 1]} de ${year}`;

  return (
    <div className="grid gap-6">
      <PageHeader title="Agenda" description="Clique num agendamento para ver os detalhes e mudar o status." />
      <AppointmentCalendar
        key={`${view}-${first}`}
        view={view}
        title={title}
        days={days}
        appointments={appointments}
        links={{
          prev: href(view, view === "week" ? addDays(anchor, -step) : shiftMonth(-1)),
          next: href(view, view === "week" ? addDays(anchor, step) : shiftMonth(1)),
          today: href(view, today),
          week: href("week", anchor),
          month: href("month", anchor),
        }}
      />
    </div>
  );
}
