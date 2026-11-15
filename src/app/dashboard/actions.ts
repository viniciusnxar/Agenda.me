"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth";
import { PLATFORMS, toSocialHref } from "@/lib/social";
import { isThemeKey } from "@/lib/theme";
import {
  bookingSettingsSchema,
  exceptionSchema,
  profileSchema,
  weeklyRulesSchema,
  type BookingSettingsInput,
  type ExceptionInput,
  type ProfileInput,
  type WeeklyRuleInput,
} from "@/lib/validation/schemas";

type Profile = Awaited<ReturnType<typeof requireProfile>>["profile"];

function revalidateProfile(profile: Pick<Profile, "username">) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${profile.username}`);
}

// ---------------------------------------------------------------------------
// Editor da página: perfil, redes sociais e avatar
// ---------------------------------------------------------------------------

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema
    .refine((p) => isThemeKey(p.theme), { path: ["theme"], message: "Tema inválido" })
    .safeParse(input);
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const { profile, supabase } = await requireProfile();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", profile.id);
  if (error) return fail("Não foi possível salvar. Tente novamente.");

  revalidateProfile(profile);
  return ok();
}

const socialLinkSchema = z
  .object({
    id: z.uuid().optional(),
    platform: z.enum(PLATFORMS),
    label: z
      .string()
      .trim()
      .max(60, "Máximo de 60 caracteres")
      .transform((v) => v || null),
    url: z.string().trim().min(1, "Informe o link").max(500, "Máximo de 500 caracteres"),
    is_active: z.boolean(),
  })
  .refine((l) => toSocialHref(l.platform, l.url) !== null, { path: ["url"], message: "Link inválido" });

export type SocialLinkInput = z.input<typeof socialLinkSchema>;

/**
 * Salva a lista inteira na ordem recebida. Primeiro grava (upsert), depois apaga os removidos:
 * se a gravação falhar, nada é perdido.
 */
export async function saveSocialLinks(input: SocialLinkInput[]): Promise<ActionResult> {
  const parsed = z.array(socialLinkSchema).max(20, "Máximo de 20 links").safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const row = typeof issue.path[0] === "number" ? ` (link ${issue.path[0] + 1})` : "";
    return fail(`${issue.message}${row}`);
  }

  const { profile, supabase } = await requireProfile();
  const { data: existing, error: loadError } = await supabase
    .from("social_links")
    .select("id")
    .eq("profile_id", profile.id);
  if (loadError) return fail("Não foi possível salvar. Tente novamente.");

  const existingIds = new Set(existing.map((l) => l.id));
  const rows = parsed.data.map((l, position) => ({
    // id de outro perfil (ou inventado) vira link novo
    id: l.id && existingIds.has(l.id) ? l.id : crypto.randomUUID(),
    profile_id: profile.id,
    platform: l.platform,
    label: l.label,
    url: l.url,
    is_active: l.is_active,
    position,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("social_links").upsert(rows);
    if (error) return fail("Não foi possível salvar. Tente novamente.");
  }

  const keep = new Set(rows.map((r) => r.id));
  const removed = [...existingIds].filter((id) => !keep.has(id));
  if (removed.length > 0) {
    const { error } = await supabase.from("social_links").delete().in("id", removed).eq("profile_id", profile.id);
    if (error) return fail("Links salvos, mas não foi possível remover os excluídos. Tente de novo.");
  }

  revalidateProfile(profile);
  return ok();
}

const AVATAR_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Caminho do arquivo no bucket a partir da URL pública, só se estiver na pasta do usuário. */
function ownAvatarPath(url: string | null, userId: string): string | null {
  const match = url?.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
  return match && match[1].startsWith(`${userId}/`) ? decodeURIComponent(match[1]) : null;
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return fail("Escolha uma imagem");
  const ext = AVATAR_TYPES[file.type];
  if (!ext) return fail("Use uma imagem PNG, JPG ou WEBP");
  if (file.size > AVATAR_MAX_BYTES) return fail("A imagem precisa ter no máximo 2 MB");

  const { profile, user, supabase } = await requireProfile();
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) return fail("Não foi possível enviar a imagem. Tente novamente.");

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return fail("Não foi possível salvar a imagem. Tente novamente.");
  }

  // a foto antiga só é apagada depois que a nova foi salva
  const oldPath = ownAvatarPath(profile.avatar_url, user.id);
  if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);

  revalidateProfile(profile);
  return ok({ url: publicUrl });
}

export async function removeAvatar(): Promise<ActionResult> {
  const { profile, user, supabase } = await requireProfile();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
  if (error) return fail("Não foi possível remover. Tente novamente.");

  const oldPath = ownAvatarPath(profile.avatar_url, user.id);
  if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);

  revalidateProfile(profile);
  return ok();
}

// ---------------------------------------------------------------------------
// Publicação da página
// ---------------------------------------------------------------------------

export async function setPublished(published: boolean): Promise<ActionResult> {
  const { profile, supabase } = await requireProfile();
  const { error } = await supabase.from("profiles").update({ is_published: published }).eq("id", profile.id);
  if (error) return fail("Não foi possível atualizar. Tente novamente.");
  revalidateProfile(profile);
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

// ---------------------------------------------------------------------------
// Disponibilidade: horários semanais e exceções
// ---------------------------------------------------------------------------

function revalidateAvailability(profile: Pick<Profile, "username">) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${profile.username}/agendar`);
}

/** Troca todos os horários semanais. Insere os novos antes de apagar os antigos: falha não perde nada. */
export async function saveWeeklyRules(input: WeeklyRuleInput[]): Promise<ActionResult> {
  const parsed = weeklyRulesSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { profile, supabase } = await requireProfile();
  const { data: old, error: loadError } = await supabase
    .from("availability_rules")
    .select("id")
    .eq("profile_id", profile.id);
  if (loadError) return fail("Não foi possível salvar. Tente novamente.");

  if (parsed.data.length > 0) {
    const { error } = await supabase
      .from("availability_rules")
      .insert(parsed.data.map((r) => ({ ...r, profile_id: profile.id })));
    if (error) return fail("Não foi possível salvar. Tente novamente.");
  }

  if (old.length > 0) {
    const { error } = await supabase
      .from("availability_rules")
      .delete()
      .in(
        "id",
        old.map((r) => r.id),
      )
      .eq("profile_id", profile.id);
    if (error) return fail("Horários salvos, mas os antigos não foram removidos. Salve de novo.");
  }

  revalidateAvailability(profile);
  return ok();
}

export async function addException(input: ExceptionInput): Promise<ActionResult> {
  const parsed = exceptionSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const { profile, supabase } = await requireProfile();
  const e = parsed.data;
  const { error } = await supabase.from("availability_exceptions").insert({
    profile_id: profile.id,
    date: e.date,
    is_blocked: e.is_blocked,
    start_time: e.is_blocked ? null : e.start_time,
    end_time: e.is_blocked ? null : e.end_time,
    reason: e.reason,
  });
  if (error) return fail("Não foi possível salvar. Tente novamente.");

  revalidateAvailability(profile);
  return ok();
}

export async function deleteException(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("Exceção inválida");

  const { profile, supabase } = await requireProfile();
  const { error } = await supabase.from("availability_exceptions").delete().eq("id", id).eq("profile_id", profile.id);
  if (error) return fail("Não foi possível remover. Tente novamente.");

  revalidateAvailability(profile);
  return ok();
}

// ---------------------------------------------------------------------------
// Regras de agendamento e planos
// ---------------------------------------------------------------------------

export async function updateBookingSettings(input: BookingSettingsInput): Promise<ActionResult> {
  const parsed = bookingSettingsSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const { profile, supabase } = await requireProfile();
  const { error } = await supabase.from("booking_settings").update(parsed.data).eq("profile_id", profile.id);
  if (error) return fail("Não foi possível salvar. Tente novamente.");

  revalidateProfile(profile);
  revalidateAvailability(profile);
  return ok();
}

const plansSchema = z
  .array(
    z.object({
      id: z.uuid().optional(),
      name: z.string().trim().min(1, "Dê um nome ao plano").max(80, "Máximo de 80 caracteres"),
      is_active: z.boolean(),
    }),
  )
  .max(50, "Máximo de 50 planos")
  .refine((plans) => new Set(plans.map((p) => p.name.toLowerCase())).size === plans.length, "Há planos com o mesmo nome");

export type PlanInput = z.input<typeof plansSchema>[number];

/**
 * Salva a lista na ordem recebida. Diferente dos links, apaga os removidos antes do upsert
 * (o nome é único por perfil); se o upsert falhar, só se perde o que já ia ser removido.
 */
export async function savePlans(input: PlanInput[]): Promise<ActionResult> {
  const parsed = plansSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { profile, supabase } = await requireProfile();
  const { data: existing, error: loadError } = await supabase.from("plans").select("id").eq("profile_id", profile.id);
  if (loadError) return fail("Não foi possível salvar. Tente novamente.");

  const existingIds = new Set(existing.map((p) => p.id));
  const rows = parsed.data.map((p, position) => ({
    id: p.id && existingIds.has(p.id) ? p.id : crypto.randomUUID(),
    profile_id: profile.id,
    name: p.name,
    is_active: p.is_active,
    position,
  }));

  const keep = new Set(rows.map((r) => r.id));
  const removed = [...existingIds].filter((id) => !keep.has(id));

  // apaga antes: um plano removido pode ter o mesmo nome de um novo (unique por perfil)
  if (removed.length > 0) {
    const { error } = await supabase.from("plans").delete().in("id", removed).eq("profile_id", profile.id);
    if (error) return fail("Não foi possível salvar. Tente novamente.");
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("plans").upsert(rows);
    if (error) {
      if (error.code === "23505") return fail("Há planos com o mesmo nome");
      return fail("Não foi possível salvar. Tente novamente.");
    }
  }

  revalidateAvailability(profile);
  return ok();
}
