import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AppointmentDetails } from "@/components/dashboard/appointment-details";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { formatCpf, formatDateLong, formatDateTime, formatTime } from "@/lib/format";
import { toLocalDate } from "@/lib/scheduling";

export const metadata: Metadata = { title: "Agendamento" };

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { profile, supabase } = await requireProfile();
  const { data: a } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, source, client_name, client_phone, client_cpf, plan_name, notes, consent_at, created_at, cancelled_at")
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!a) notFound();

  const tz = profile.timezone;

  return (
    <div className="grid max-w-xl gap-6">
      <Button asChild variant="ghost" size="sm" className="justify-self-start">
        <Link href={`/dashboard/agenda?date=${toLocalDate(new Date(a.starts_at), tz)}`}>
          <ArrowLeft aria-hidden="true" /> Agenda
        </Link>
      </Button>
      <PageHeader title={a.client_name} />
      <Card>
        <CardContent className="pt-6">
          <AppointmentDetails
            appointment={{
              id: a.id,
              status: a.status,
              source: a.source,
              client_name: a.client_name,
              client_phone: a.client_phone,
              cpf: a.client_cpf ? formatCpf(a.client_cpf) : null,
              plan_name: a.plan_name,
              notes: a.notes,
              dateLabel: formatDateLong(a.starts_at, tz),
              timeLabel: `${formatTime(a.starts_at, tz)} às ${formatTime(a.ends_at, tz)}`,
            }}
          />
        </CardContent>
      </Card>
      <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-sm text-muted-foreground">
        <dt>Criado em</dt>
        <dd>{formatDateTime(a.created_at, tz)}</dd>
        {a.consent_at && (
          <>
            <dt>Consentimento LGPD</dt>
            <dd>{formatDateTime(a.consent_at, tz)}</dd>
          </>
        )}
        {a.cancelled_at && (
          <>
            <dt>Cancelado em</dt>
            <dd>{formatDateTime(a.cancelled_at, tz)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
