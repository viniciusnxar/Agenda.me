import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/public/booking-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBookingWindow } from "@/lib/scheduling";
import { loadBookingContext } from "@/lib/scheduling-data";

import { getCalendar } from "./actions";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const ctx = await loadBookingContext(username);
  return { title: ctx ? `Agendar com ${ctx.profile.full_name}` : "Agendar", robots: { index: false } };
}

export default async function BookingPage({ params }: Props) {
  const { username } = await params;
  const ctx = await loadBookingContext(username);
  if (!ctx || !ctx.settingsRow.is_enabled) notFound();

  const { profile, settingsRow: s } = ctx;
  const window = getBookingWindow(ctx.settings, new Date(), profile.timezone);
  const [year, month] = window.first.split("-").map(Number);

  const calendar = await getCalendar(username, year, month);
  const whatsappAvailable = s.whatsapp_enabled && Boolean(profile.whatsapp);

  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto grid max-w-md gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <Link
            href={`/${profile.username}`}
            className="rounded-md p-2 hover:bg-muted"
            aria-label={`Voltar para a página de ${profile.full_name}`}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Avatar className="size-12">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="" className="object-cover" />}
            <AvatarFallback>{profile.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">Agendar com {profile.full_name}</h1>
            {profile.profession && <p className="text-sm text-muted-foreground">{profile.profession}</p>}
          </div>
        </header>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          {calendar.ok ? (
            <BookingFlow
              username={profile.username}
              timezone={profile.timezone}
              initial={{ year, month, days: calendar.data }}
              monthRange={{ first: window.first.slice(0, 7), last: window.last.slice(0, 7) }}
              formOptions={{
                requireCpf: s.require_cpf,
                plansEnabled: s.plans_enabled,
                requirePlan: s.require_plan,
                allowPrivate: s.allow_private,
                plans: ctx.plans,
                whatsappAvailable,
              }}
              whatsapp={
                whatsappAvailable
                  ? { phone: profile.whatsapp!, template: s.whatsapp_message_template, holdSlot: s.whatsapp_hold_slot }
                  : null
              }
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{calendar.error}</p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Horários no fuso de {profile.full_name.split(" ")[0]} ({profile.timezone.replace(/_/g, " ")}).
        </p>
      </main>
    </div>
  );
}
