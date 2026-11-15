"use server";

import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  generateSlots,
  getBookingWindow,
  getMonthStatus,
  isInWindow,
  monthDates,
  toLocalDate,
  toLocalTime,
  type CalendarDay,
} from "@/lib/scheduling";
import { loadBookingContext, loadBusyRanges, localDaysRange, resolvePlan } from "@/lib/scheduling-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { appointmentSchemaFor, type AppointmentInput } from "@/lib/validation/schemas";

const MAX_ACTIVE_PER_CLIENT = 3; // anti-spam: agendamentos futuros ativos por telefone/CPF por perfil

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type SlotOption = { start: string; label: string };

/** Status de cada dia de um mês (disponível / lotado / fechado). */
export async function getCalendar(username: string, year: number, month: number): Promise<ActionResult<CalendarDay[]>> {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return fail("Mês inválido");

  const ctx = await loadBookingContext(username);
  if (!ctx || !ctx.settingsRow.is_enabled) return fail("Agenda indisponível");

  const days = monthDates(year, month);
  const { from, to } = localDaysRange(days[0], days.at(-1)!, ctx.profile.timezone);

  try {
    const busyRanges = await loadBusyRanges(ctx.profile.id, from, to);
    return ok(
      getMonthStatus({
        year,
        month,
        settings: ctx.settings,
        weeklyRules: ctx.weeklyRules,
        exceptions: ctx.exceptions,
        busyRanges,
        now: new Date(),
        timezone: ctx.profile.timezone,
      }),
    );
  } catch {
    return fail("Não foi possível carregar a agenda. Tente novamente.");
  }
}

/** Horários livres de um dia. */
export async function getSlots(username: string, date: string): Promise<ActionResult<SlotOption[]>> {
  if (!dateSchema.safeParse(date).success) return fail("Data inválida");

  const ctx = await loadBookingContext(username);
  if (!ctx || !ctx.settingsRow.is_enabled) return fail("Agenda indisponível");

  const { timezone } = ctx.profile;
  const now = new Date();
  if (!isInWindow(date, getBookingWindow(ctx.settings, now, timezone))) return ok([]);

  try {
    const { from, to } = localDaysRange(date, date, timezone);
    const busyRanges = await loadBusyRanges(ctx.profile.id, from, to);
    const slots = generateSlots({ date, ...ctx, busyRanges, now, timezone });
    return ok(slots.map((s) => ({ start: s.start.toISOString(), label: toLocalTime(s.start, timezone) })));
  } catch {
    return fail("Não foi possível carregar os horários. Tente novamente.");
  }
}

// Entrada não confiável: o zod é quem garante consent === true
export type CreateAppointmentInput = Omit<AppointmentInput, "consent"> & {
  consent: boolean;
  source: "booking" | "whatsapp";
};
export type CreatedAppointment = { token: string; status: "pending" | "confirmed" };

/**
 * Cria o agendamento do cliente (seção 6): valida, recalcula os horários, grava com o client
 * admin e trata o conflito 23P01. Nunca registra CPF em log.
 */
export async function createAppointment(
  username: string,
  input: CreateAppointmentInput,
): Promise<ActionResult<CreatedAppointment>> {
  const ctx = await loadBookingContext(username);
  if (!ctx || !ctx.settingsRow.is_enabled) return fail("Agenda indisponível");
  const { settingsRow: s, profile } = ctx;

  const source = input.source === "whatsapp" ? "whatsapp" : "booking";
  // pelo WhatsApp só grava quando o profissional quer segurar o horário
  if (source === "whatsapp" && !(s.whatsapp_enabled && s.whatsapp_hold_slot)) return fail("Agendamento indisponível");

  const parsed = appointmentSchemaFor({
    require_cpf: s.require_cpf,
    require_plan: s.plans_enabled && s.require_plan,
  }).safeParse(input);
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);
  const data = parsed.data;

  const plan = resolvePlan(data.plan_id, s, ctx.plans);
  if (!plan.ok) return fail("Confira os campos", { plan_id: [plan.error] });

  // recalcula: o horário precisa estar na janela e ainda livre
  const now = new Date();
  const start = new Date(data.starts_at);
  const date = toLocalDate(start, profile.timezone);
  if (!isInWindow(date, getBookingWindow(ctx.settings, now, profile.timezone))) {
    return fail("Esse horário não está mais disponível. Escolha outro.");
  }

  const db = createAdminClient();
  try {
    const { from, to } = localDaysRange(date, date, profile.timezone);
    const busyRanges = await loadBusyRanges(profile.id, from, to);
    const slot = generateSlots({ date, ...ctx, busyRanges, now, timezone: profile.timezone }).find(
      (sl) => sl.start.getTime() === start.getTime(),
    );
    if (!slot) return fail("Esse horário não está mais disponível. Escolha outro.");

    // anti-spam: telefone e CPF são só dígitos (validados pelo zod), seguros no filtro .or()
    const clientFilter = [`client_phone.eq.${data.client_phone}`, data.client_cpf && `client_cpf.eq.${data.client_cpf}`]
      .filter(Boolean)
      .join(",");
    const { count } = await db
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", now.toISOString())
      .or(clientFilter);
    if ((count ?? 0) >= MAX_ACTIVE_PER_CLIENT) {
      return fail("Você já tem agendamentos em aberto com este profissional. Fale com ele para marcar outro.");
    }

    const status = source === "booking" && s.auto_confirm ? "confirmed" : "pending";
    const { data: created, error } = await db
      .from("appointments")
      .insert({
        profile_id: profile.id,
        starts_at: slot.start.toISOString(),
        ends_at: slot.end.toISOString(),
        blocked_until: slot.blockedUntil.toISOString(),
        status,
        source,
        client_name: data.client_name,
        client_phone: data.client_phone,
        client_cpf: data.client_cpf ?? null,
        plan_id: plan.planId,
        plan_name: plan.planName,
        notes: data.notes,
        consent_at: now.toISOString(),
      })
      .select("cancel_token")
      .single();

    if (error) {
      if (error.code === "23P01") return fail("Esse horário acabou de ser reservado. Escolha outro.");
      console.error("createAppointment: insert falhou", error.code); // sem dados do cliente
      return fail("Não foi possível agendar. Tente novamente.");
    }

    return ok({ token: created.cancel_token, status });
  } catch (e) {
    console.error("createAppointment: erro inesperado", e instanceof Error ? e.message : "desconhecido");
    return fail("Não foi possível agendar. Tente novamente.");
  }
}
