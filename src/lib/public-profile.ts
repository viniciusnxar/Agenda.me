import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

import { isPlatform, type Platform } from "@/lib/social";
import type { Database, Tables } from "@/types/database";

export type PublicSocialLink = {
  id: string;
  platform: Platform;
  label: string | null;
  url: string;
};

export type PublicProfile = Pick<
  Tables<"profiles">,
  "id" | "username" | "full_name" | "profession" | "registration" | "bio" | "avatar_url" | "whatsapp" | "timezone" | "theme"
> & {
  socialLinks: PublicSocialLink[];
  bookingEnabled: boolean;
};

// Client sem cookies: enxerga só o que a RLS libera para o público (perfis publicados).
function createPublicClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Perfil publicado pelo username, com redes ativas em ordem. cache() evita buscar duas vezes por request. */
export const getPublicProfile = cache(async (username: string): Promise<PublicProfile | null> => {
  const { data, error } = await createPublicClient()
    .from("profiles")
    .select(
      "id, username, full_name, profession, registration, bio, avatar_url, whatsapp, timezone, theme, social_links(id, platform, label, url, position, is_active), booking_settings(is_enabled)",
    )
    .eq("username", username.toLowerCase())
    .eq("is_published", true)
    .order("position", { referencedTable: "social_links" })
    .maybeSingle();

  if (error || !data) return null;

  const { social_links, booking_settings, ...profile } = data;
  return {
    ...profile,
    socialLinks: social_links
      .filter((l) => l.is_active && isPlatform(l.platform))
      .map((l) => ({ id: l.id, platform: l.platform as Platform, label: l.label, url: l.url })),
    bookingEnabled: booking_settings?.is_enabled ?? false,
  };
});
