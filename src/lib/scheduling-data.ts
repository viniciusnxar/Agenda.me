import "server-only";

import { cache } from "react";

import {
  addDays,
  toBusyRanges,
  toExceptions,
  toSchedulingSettings,
  toWeeklyRules,
  zonedToUtc,
  type AvailabilityException,
  type BusyRange,
  type LocalDate,
  type SchedulingSettings,
  type WeeklyRule,
} from "@/lib/scheduling";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRIVATE_PLAN } from "@/lib/validation/schemas";
import type { Tables } from "@/types/database";

export type BookingPlan = { id: string; name: string };

export type BookingContext = {
  profile: Pick<Tables<"profiles">, "id" | "username" | "full_name" | "profession" | "avatar_url" | "whatsapp" | "timezone" | "theme">;
  settingsRow: Tables<"booking_settings">;
  settings: SchedulingSettings;
  weeklyRules: WeeklyRule[];
  exceptions: AvailabilityException[];
  plans: BookingPlan[];
};

/**
 * Tudo que o agendamento público precisa de um perfil publicado.
 * Usa o client admin (o insert do agendamento também usa), então o filtro is_published é obrigatório.
 */
export const loadBookingContext = cache(async (username: string): Promise<BookingContext | null> => {
  const db = createAdminClient();

  const { data: profile } = await db
    .from("profiles")
    .select("id, username, full_name, profession, avatar_url, whatsapp, timezone, theme")
    .eq("username", username.toLowerCase())
    .eq("is_published", true)
    .maybeSingle();
  if (!profile) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [settings, rules, exceptions, plans] = await Promise.all([
    db.from("booking_settings").select("*").eq("profile_id", profile.id).single(),
    db.from("availability_rules").select("weekday, start_time, end_time").eq("profile_id", profile.id),
    // exceções passadas não interessam (folga de 1 dia por causa do fuso)
    db
      .from("availability_exceptions")
      .select("date, is_blocked, start_time, end_time")
      .eq("profile_id", profile.id)
      .gte("date", addDays(today, -1)),
    db.from("plans").select("id, name").eq("profile_id", profile.id).eq("is_active", true).order("position"),
  ]);
  if (!settings.data) return null;

  return {
    profile,
    settingsRow: settings.data,
    settings: toSchedulingSettings(settings.data),
    weeklyRules: toWeeklyRules(rules.data ?? []),
    exceptions: toExceptions(exceptions.data ?? []),
    plans: plans.data ?? [],
  };
});

/** Intervalo UTC que cobre os dias locais [first, last]. */
export function localDaysRange(first: LocalDate, last: LocalDate, timezone: string): { from: Date; to: Date } {
  return { from: zonedToUtc(first, "00:00", timezone), to: zonedToUtc(addDays(last, 1), "00:00", timezone) };
}

/** Horários ocupados (só intervalos, sem dados de cliente) via RPC get_busy_ranges. */
export async function loadBusyRanges(profileId: string, from: Date, to: Date): Promise<BusyRange[]> {
  const { data, error } = await createAdminClient().rpc("get_busy_ranges", {
    p_profile_id: profileId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw new Error(`get_busy_ranges falhou: ${error.code}`);
  return toBusyRanges(data ?? []);
}

export type ResolvedPlan = { ok: true; planId: string | null; planName: string | null } | { ok: false; error: string };

/** Confere o plano escolhido contra as regras e os planos ativos do profissional. */
export function resolvePlan(
  choice: string | undefined,
  settings: Pick<Tables<"booking_settings">, "plans_enabled" | "require_plan" | "allow_private">,
  plans: BookingPlan[],
): ResolvedPlan {
  if (!settings.plans_enabled) return { ok: true, planId: null, planName: null };

  if (!choice) {
    return settings.require_plan ? { ok: false, error: "Escolha um plano" } : { ok: true, planId: null, planName: null };
  }
  if (choice === PRIVATE_PLAN) {
    return settings.allow_private
      ? { ok: true, planId: null, planName: "Particular" }
      : { ok: false, error: "Atendimento particular não disponível" };
  }
  const plan = plans.find((p) => p.id === choice);
  return plan ? { ok: true, planId: plan.id, planName: plan.name } : { ok: false, error: "Plano não aceito" };
}
