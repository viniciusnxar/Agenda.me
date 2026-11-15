"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getAppUrl, getPostLoginPath, safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = ActionResult<{ message: string }> | null;

const emailSchema = z.email("Informe um e-mail válido").trim().toLowerCase();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha"),
});

const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72, "Máximo de 72 caracteres"),
});

function callbackUrl(next: string): string {
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return fail("Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.");
    return fail("E-mail ou senha incorretos");
  }

  redirect(await getPostLoginPath(supabase, data.user.id, formData.get("next")));
}

export async function sendMagicLink(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return fail("Confira os campos", { email: ["Informe um e-mail válido"] });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(safeNextPath(formData.get("next"))) },
  });
  if (error?.status === 429) return fail("Muitas tentativas. Aguarde um minuto e tente de novo.");
  // Outros erros (inclusive conta inexistente) recebem a mesma resposta, para não revelar quem tem cadastro.

  return ok({ message: "Se houver uma conta com esse e-mail, enviamos um link de acesso. Confira sua caixa de entrada." });
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Confira os campos", z.flattenError(parsed.error).fieldErrors);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: callbackUrl("/onboarding") },
  });
  if (error) {
    if (error.code === "weak_password") return fail("Escolha uma senha mais forte");
    if (error.status === 429) return fail("Muitas tentativas. Aguarde um minuto e tente de novo.");
    return fail("Não foi possível criar a conta. Tente novamente.");
  }

  // Confirmação de e-mail desligada no Supabase: já entra logado
  if (data.session) redirect("/onboarding");

  return ok({ message: "Conta criada! Enviamos um e-mail de confirmação. Clique no link para continuar." });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
