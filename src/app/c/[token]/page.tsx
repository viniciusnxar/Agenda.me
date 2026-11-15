import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { AppointmentSummary } from "@/components/public/appointment-summary";
import { Button } from "@/components/ui/button";
import { canCancel, getAppointmentByToken } from "@/lib/appointment-token";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Seu agendamento", robots: { index: false, follow: false } };

export default async function ManageAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appointment = await getAppointmentByToken(token);
  if (!appointment) notFound();

  const { profile } = appointment;

  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto grid max-w-md gap-6 px-4 py-12">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold">Seu agendamento</h1>

        <AppointmentSummary
          professionalName={profile.full_name}
          profession={profile.profession}
          startsAt={appointment.starts_at}
          endsAt={appointment.ends_at}
          timezone={profile.timezone}
          status={appointment.status}
          clientName={appointment.client_name}
          planName={appointment.plan_name}
        />

        <div className="grid gap-2">
          {canCancel(appointment) && <CancelButton token={token} />}
          {profile.whatsapp && (
            <Button asChild variant="outline">
              <a href={buildWhatsAppLink(profile.whatsapp)} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" /> Falar com {profile.full_name.split(" ")[0]}
              </a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href={`/${profile.username}`}>Ver página de {profile.full_name}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
