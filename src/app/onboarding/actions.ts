"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, usernameSchema } from "@/lib/validation/schemas";

const onboardingSchema = profileSchema
  .pick({ full_name: true, profession: true, whatsapp: true })
  .extend({ username: usernameSchema });

export type UsernameCheck = { available: boolean; message: string };

/** Disponibilidade do username. Usa o client admin porque a RLS esconde perfis não publicados. */
export async function checkUsername(value: string): Promise<UsernameCheck> {
  await requireUser();

  const parsed = usernameSchema.safeParse(value);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0].message };

  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .maybeSingle();
  if (error) return { available: false, message: "Não foi possível verificar agora" };

  return data
    ? { available: false, message: "Esse endereço já está em uso" }
    : { available: true, message: "Endereço disponível" };
}

export type OnboardingState = ActionResult | null;

export async function createProfile(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const supabase = await createClient();
  // o trigger handle_new_profile cria as regras de agendamento padrão
  const { error } = await supabase.from("profiles").insert({ id: user.id, ...parsed.data });

  if (error) {
    if (error.code === "23505") {
      // unique: ou o username já existe ou o perfil já foi criado (duplo clique)
      const { data: own } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (own) redirect("/dashboard");
      return fail("Confira os campos", { username: ["Esse endereço já está em uso"] });
    }
    return fail("Não foi possível salvar. Tente novamente.");
  }

  redirect("/dashboard");
}
