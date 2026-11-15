import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { PlansEditor } from "@/components/dashboard/plans-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Planos" };

export default async function PlansPage() {
  const { profile, supabase } = await requireProfile();
  const [plansRes, settingsRes] = await Promise.all([
    supabase.from("plans").select("id, name, is_active").eq("profile_id", profile.id).order("position"),
    supabase.from("booking_settings").select("plans_enabled").eq("profile_id", profile.id).maybeSingle(),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Planos e convênios" description="Os planos que o paciente pode escolher ao agendar." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus planos</CardTitle>
          {!settingsRes.data?.plans_enabled && (
            <CardDescription>
              A pergunta do plano está desligada. Ative em{" "}
              <Link href="/dashboard/regras" className="underline underline-offset-4">
                Regras
              </Link>
              .
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PlansEditor plans={plansRes.data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
