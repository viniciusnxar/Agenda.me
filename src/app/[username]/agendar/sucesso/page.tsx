import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyField } from "@/app/c/[token]/cancel-button";
import { AppointmentSummary } from "@/components/public/appointment-summary";
import { Button } from "@/components/ui/button";
import { getAppointmentByToken } from "@/lib/appointment-token";
import { getAppUrl } from "@/lib/auth";

export const metadata: Metadata = { title: "Agendamento enviado", robots: { index: false } };

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const [{ username }, { t }] = await Promise.all([params, searchParams]);
  const appointment = await getAppointmentByToken(t);
  if (!appointment || appointment.profile.username !== username.toLowerCase()) notFound();

  const confirmed = appointment.status === "confirmed";
  const manageUrl = `${getAppUrl()}/c/${t}`;

  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto grid max-w-md gap-6 px-4 py-12">
        <div className="text-center">
          {confirmed ? (
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
          ) : (
            <Clock className="mx-auto size-12 text-amber-600" aria-hidden="true" />
          )}
          <h1 className="mt-4 text-2xl font-bold">{confirmed ? "Agendamento confirmado!" : "Pedido enviado!"}</h1>
          <p className="mt-2 text-muted-foreground">
            {confirmed
              ? "Seu horário está reservado."
              : `Seu horário está reservado e aguarda a confirmação de ${appointment.profile.full_name}.`}
          </p>
        </div>

        <AppointmentSummary
          professionalName={appointment.profile.full_name}
          profession={appointment.profile.profession}
          startsAt={appointment.starts_at}
          endsAt={appointment.ends_at}
          timezone={appointment.profile.timezone}
          status={appointment.status}
          clientName={appointment.client_name}
          planName={appointment.plan_name}
        />

        <div className="grid gap-2 rounded-xl border bg-background p-5">
          <p className="font-medium">Guarde este link</p>
          <p className="text-sm text-muted-foreground">
            Por ele você vê os detalhes ou cancela o agendamento. Quem tiver o link consegue cancelar, então não
            compartilhe.
          </p>
          <CopyField value={manageUrl} />
        </div>

        <Button asChild variant="outline">
          <Link href={`/${appointment.profile.username}`}>Voltar para a página</Link>
        </Button>
      </main>
    </div>
  );
}
