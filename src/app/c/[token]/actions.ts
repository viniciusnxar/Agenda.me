"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { cancelByToken } from "@/lib/appointment-token";

export async function cancelAppointment(token: string): Promise<ActionResult> {
  const cancelled = await cancelByToken(token);
  if (!cancelled) return fail("Não foi possível cancelar. O agendamento já passou ou já foi cancelado.");
  revalidatePath(`/c/${token}`);
  return ok();
}
