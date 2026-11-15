import { CalendarDays, Clock, CreditCard, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateLong, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Aguardando confirmação", className: "bg-amber-100 text-amber-900 border-amber-200" },
  confirmed: { label: "Confirmado", className: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  completed: { label: "Concluído", className: "bg-sky-100 text-sky-900 border-sky-200" },
  no_show: { label: "Não compareceu", className: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-900 border-red-200" },
};

export function AppointmentStatusBadge({ status, className }: { status: string; className?: string }) {
  const info = APPOINTMENT_STATUS[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn(info.className, className)}>
      {info.label}
    </Badge>
  );
}

type AppointmentSummaryProps = {
  professionalName: string;
  profession: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  clientName: string;
  planName: string | null;
};

export function AppointmentSummary({
  professionalName,
  profession,
  startsAt,
  endsAt,
  timezone,
  status,
  clientName,
  planName,
}: AppointmentSummaryProps) {
  return (
    <div className="grid gap-4 rounded-xl border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{professionalName}</p>
          {profession && <p className="text-sm text-muted-foreground">{profession}</p>}
        </div>
        <AppointmentStatusBadge status={status} />
      </div>
      <dl className="grid gap-3 text-sm">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Data</dt>
          <dd className="first-letter:uppercase">{formatDateLong(startsAt, timezone)}</dd>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Horário</dt>
          <dd>
            {formatTime(startsAt, timezone)} às {formatTime(endsAt, timezone)}
          </dd>
        </div>
        <div className="flex items-center gap-3">
          <User className="size-4 text-muted-foreground" aria-hidden="true" />
          <dt className="sr-only">Paciente</dt>
          <dd>{clientName}</dd>
        </div>
        {planName && (
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Plano</dt>
            <dd>{planName}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
