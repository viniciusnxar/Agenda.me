"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Publicação da página
// ---------------------------------------------------------------------------

export async function setPublished(published: boolean): Promise<ActionResult> {
  const { profile, supabase } = await requireProfile();
  const { error } = await supabase.from("profiles").update({ is_published: published }).eq("id", profile.id);
  if (error) return fail("Não foi possível atualizar. Tente novamente.");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${profile.username}`);
  return ok();
}

// ---------------------------------------------------------------------------
// Status dos agendamentos
// ---------------------------------------------------------------------------

export type StatusAction = "confirm" | "cancel" | "complete" | "no_show";

// de quais status cada ação pode partir, e para qual status leva
const TRANSITIONS: Record<StatusAction, { from: string[]; to: string }> = {
  confirm: { from: ["pending"], to: "confirmed" },
  cancel: { from: ["pending", "confirmed"], to: "cancelled" },
  complete: { from: ["confirmed"], to: "completed" },
  no_show: { from: ["confirmed"], to: "no_show" },
};

export async function updateAppointmentStatus(id: string, action: StatusAction): Promise<ActionResult> {
  const transition = TRANSITIONS[action];
  if (!transition) return fail("Ação inválida");

  const { profile, supabase } = await requireProfile();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: transition.to,
      ...(transition.to === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("profile_id", profile.id)
    .in("status", transition.from)
    .select("id");

  if (error) return fail("Não foi possível atualizar. Tente novamente.");
  if (!data?.length) return fail("Esse agendamento mudou enquanto você olhava. Atualize a página.");

  revalidatePath("/dashboard", "layout");
  return ok();
}
