import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Só aceita caminhos internos ("/dashboard"), nunca URLs externas ("//site.com", "https://...")
 * para o ?next= não virar redirecionamento aberto.
 */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

/** URL pública do app, usada nos links enviados por e-mail. */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Para onde mandar depois do login: quem ainda não tem perfil vai para o onboarding. */
export async function getPostLoginPath(supabase: ServerClient, userId: string, next?: unknown): Promise<string> {
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) return "/onboarding";
  return safeNextPath(next);
}
