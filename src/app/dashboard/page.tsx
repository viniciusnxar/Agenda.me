import { CalendarCheck, CircleAlert, Clock } from "lucide-react";
import Link from "next/link";

import { AppointmentRow, type AppointmentRowData } from "@/components/dashboard/appointment-row";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { formatDateLong } from "@/lib/format";
import { addDays, toLocalDate, zonedToUtc } from "@/lib/scheduling";

import { PublishSwitch } from "./publish-switch";

const ROW_FIELDS = "id, starts_at, status, source, client_name, client_phone, plan_name";

function AppointmentList({
  items,
  timezone,
  showDate,
  empty,
}: {
  items: AppointmentRowData[];
  timezone: string;
  showDate?: boolean;
  empty: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {items.map((a) => (
        <AppointmentRow key={a.id} appointment={a} timezone={timezone} showDate={showDate} />
      ))}
    </ul>
  );
}

export default async function DashboardPage() {
  const { profile, supabase } = await requireProfile();
  const tz = profile.timezone;

  const now = new Date();
  const today = toLocalDate(now, tz);
  const todayStart = zonedToUtc(today, "00:00", tz).toISOString();
  const tomorrowStart = zonedToUtc(addDays(today, 1), "00:00", tz).toISOString();
  const weekEnd = zonedToUtc(addDays(today, 8), "00:00", tz).toISOString();

  const [todayRes, upcomingRes, pendingRes, settingsRes, rulesRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(ROW_FIELDS)
      .eq("profile_id", profile.id)
      .gte("starts_at", todayStart)
      .lt("starts_at", tomorrowStart)
      .in("status", ["pending", "confirmed", "completed", "no_show"])
      .order("starts_at"),
    supabase
      .from("appointments")
      .select(ROW_FIELDS)
      .eq("profile_id", profile.id)
      .gte("starts_at", tomorrowStart)
      .lt("starts_at", weekEnd)
      .in("status", ["pending", "confirmed"])
      .order("starts_at")
      .limit(10),
    supabase
      .from("appointments")
      .select(ROW_FIELDS)
      .eq("profile_id", profile.id)
      .eq("status", "pending")
      .gte("starts_at", now.toISOString())
      .order("starts_at")
      .limit(20),
    supabase.from("booking_settings").select("is_enabled").eq("profile_id", profile.id).maybeSingle(),
    supabase.from("availability_rules").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
  ]);

  const todayItems = todayRes.data ?? [];
  const upcoming = upcomingRes.data ?? [];
  const pending = pendingRes.data ?? [];

  const setup = [
    { done: (rulesRes.count ?? 0) > 0, label: "Defina seus horários de atendimento", href: "/dashboard/disponibilidade" },
    { done: settingsRes.data?.is_enabled ?? false, label: "Ative o agendamento nas regras", href: "/dashboard/regras" },
    { done: profile.is_published, label: "Publique sua página", href: "#publicar" },
  ];
  const setupPending = setup.filter((s) => !s.done);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Olá, ${profile.full_name.split(" ")[0]}`}
        description={formatDateLong(now, tz).replace(/^./, (c) => c.toUpperCase())}
        actions={
          <div id="publicar">
            <PublishSwitch published={profile.is_published} />
          </div>
        }
      />

      {setupPending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="size-4" aria-hidden="true" /> Falta pouco para receber agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1 text-sm">
              {setup.map((s) => (
                <li key={s.label} className={s.done ? "text-muted-foreground line-through" : ""}>
                  {s.done ? (
                    s.label
                  ) : (
                    <Link href={s.href} className="underline underline-offset-4">
                      {s.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarCheck className="size-4" aria-hidden="true" /> Hoje
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {todayItems.filter((a) => a.status === "pending" || a.status === "confirmed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="size-4" aria-hidden="true" /> Próximos 7 dias
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{upcoming.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CircleAlert className="size-4" aria-hidden="true" /> Pendentes
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{pending.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aguardando sua confirmação</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList items={pending} timezone={tz} showDate empty="" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentList items={todayItems} timezone={tz} empty="Nenhum agendamento para hoje." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos dias</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentList items={upcoming} timezone={tz} showDate empty="Nenhum agendamento nos próximos 7 dias." />
        </CardContent>
      </Card>
    </div>
  );
}
