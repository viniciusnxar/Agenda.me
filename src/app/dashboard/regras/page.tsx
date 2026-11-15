import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { RulesEditor } from "@/components/dashboard/rules-editor";
import { requireProfile } from "@/lib/auth";
import { WINDOW_MODES } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Regras" };

export default async function RulesPage() {
  const { profile, supabase } = await requireProfile();
  const { data } = await supabase
    .from("booking_settings")
    .select(
      "is_enabled, slot_duration_min, buffer_min, window_mode, min_advance_days, max_advance_days, min_notice_minutes, max_per_day, auto_confirm, require_cpf, plans_enabled, require_plan, allow_private, whatsapp_enabled, whatsapp_hold_slot, whatsapp_message_template",
    )
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!data) notFound(); // o trigger cria junto com o perfil; não deveria faltar

  const windowMode = WINDOW_MODES.find((m) => m === data.window_mode) ?? "flexible";

  return (
    <div className="grid gap-6">
      <PageHeader title="Regras de agendamento" description="Como e quando seus pacientes podem marcar horário." />
      <RulesEditor settings={{ ...data, window_mode: windowMode }} hasWhatsapp={Boolean(profile.whatsapp)} />
    </div>
  );
}
