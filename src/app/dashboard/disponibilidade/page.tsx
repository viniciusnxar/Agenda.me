import type { Metadata } from "next";

import { ExceptionsEditor } from "@/components/dashboard/exceptions-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { WeeklyHoursEditor } from "@/components/dashboard/weekly-hours-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { normalizeTime, toLocalDate } from "@/lib/scheduling";

export const metadata: Metadata = { title: "Disponibilidade" };

export default async function AvailabilityPage() {
  const { profile, supabase } = await requireProfile();
  const today = toLocalDate(new Date(), profile.timezone);

  const [rulesRes, exceptionsRes] = await Promise.all([
    supabase.from("availability_rules").select("weekday, start_time, end_time").eq("profile_id", profile.id),
    supabase
      .from("availability_exceptions")
      .select("id, date, is_blocked, start_time, end_time, reason")
      .eq("profile_id", profile.id)
      .gte("date", today)
      .order("date"),
  ]);

  const rules = (rulesRes.data ?? []).map((r) => ({
    weekday: r.weekday,
    start_time: normalizeTime(r.start_time),
    end_time: normalizeTime(r.end_time),
  }));

  return (
    <div className="grid gap-6">
      <PageHeader title="Disponibilidade" description="Quando você atende. Os horários usam o fuso da sua página." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários semanais</CardTitle>
          <CardDescription>Você pode ter mais de um intervalo por dia, por exemplo 08–12 e 14–18.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyHoursEditor rules={rules} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exceções</CardTitle>
          <CardDescription>
            Bloqueie dias (férias, feriados) ou defina um horário diferente para uma data específica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExceptionsEditor exceptions={exceptionsRes.data ?? []} today={today} />
        </CardContent>
      </Card>
    </div>
  );
}
