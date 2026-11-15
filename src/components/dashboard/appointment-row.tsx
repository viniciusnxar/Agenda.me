"use client";

import { Check, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateAppointmentStatus } from "@/app/dashboard/actions";
import { AppointmentStatusBadge } from "@/components/public/appointment-summary";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhone, formatTime } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type AppointmentRowData = {
  id: string;
  starts_at: string;
  status: string;
  source: string;
  client_name: string;
  client_phone: string;
  plan_name: string | null;
};

type AppointmentRowProps = {
  appointment: AppointmentRowData;
  timezone: string;
  /** mostra a data além da hora */
  showDate?: boolean;
};

export function AppointmentRow({ appointment: a, timezone, showDate }: AppointmentRowProps) {
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await updateAppointmentStatus(a.id, "confirm");
      if (result.ok) toast.success("Agendamento confirmado");
      else toast.error(result.error);
    });
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="w-16 shrink-0 text-center">
        <p className="font-semibold tabular-nums">{formatTime(a.starts_at, timezone)}</p>
        {showDate && <p className="text-xs text-muted-foreground">{formatDate(a.starts_at, timezone).slice(0, 5)}</p>}
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/dashboard/agendamentos/${a.id}`} className="block truncate font-medium hover:underline">
          {a.client_name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {formatPhone(a.client_phone)}
          {a.plan_name && ` · ${a.plan_name}`}
          {a.source === "whatsapp" && " · via WhatsApp"}
          {a.source === "manual" && " · manual"}
        </p>
      </div>

      <AppointmentStatusBadge status={a.status} className="hidden sm:inline-flex" />

      <div className="flex shrink-0 items-center gap-1">
        {a.status === "pending" && (
          <Button size="sm" variant="outline" onClick={confirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
            <span className="hidden sm:inline">Confirmar</span>
            <span className="sr-only sm:hidden">Confirmar agendamento de {a.client_name}</span>
          </Button>
        )}
        <Button size="icon" variant="ghost" asChild>
          <a
            href={buildWhatsAppLink(a.client_phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir WhatsApp de ${a.client_name}`}
          >
            <MessageCircle />
          </a>
        </Button>
        <Button size="icon" variant="ghost" asChild>
          <Link href={`/dashboard/agendamentos/${a.id}`} aria-label={`Detalhes de ${a.client_name}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </li>
  );
}
