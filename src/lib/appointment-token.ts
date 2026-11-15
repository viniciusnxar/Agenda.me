import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// O cancel_token é gerado no banco: 64 caracteres hexadecimais. Ele é a única "senha" do paciente.
export function isValidToken(token: unknown): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}

export type TokenAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  client_name: string;
  plan_name: string | null;
  profile: { username: string; full_name: string; profession: string | null; timezone: string; whatsapp: string | null };
};

/** Agendamento pelo token, sem CPF nem telefone (a página é aberta por quem tem o link). */
export async function getAppointmentByToken(token: unknown): Promise<TokenAppointment | null> {
  if (!isValidToken(token)) return null;

  const { data } = await createAdminClient()
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, source, client_name, plan_name, profile:profiles(username, full_name, profession, timezone, whatsapp)",
    )
    .eq("cancel_token", token)
    .maybeSingle();

  if (!data?.profile) return null;
  return data as TokenAppointment;
}

/** Paciente só cancela agendamento ativo que ainda não começou. */
export function canCancel(appointment: Pick<TokenAppointment, "status" | "starts_at">, now = new Date()): boolean {
  return ["pending", "confirmed"].includes(appointment.status) && new Date(appointment.starts_at) > now;
}

export async function cancelByToken(token: unknown): Promise<boolean> {
  if (!isValidToken(token)) return false;

  const now = new Date().toISOString();
  const { data, error } = await createAdminClient()
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: now })
    .eq("cancel_token", token)
    .in("status", ["pending", "confirmed"])
    .gt("starts_at", now)
    .select("id");

  return !error && (data?.length ?? 0) > 0;
}
