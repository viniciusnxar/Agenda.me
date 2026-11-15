import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileHeader } from "@/components/public/profile-header";
import { SocialCard } from "@/components/public/social-card";
import { getPublicProfile } from "@/lib/public-profile";
import { getTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return { title: "Perfil não encontrado" };

  const description =
    profile.bio?.slice(0, 160) ?? [profile.profession, "Agende sua consulta online"].filter(Boolean).join(" · ");
  return {
    title: profile.full_name,
    description,
    openGraph: { title: profile.full_name, description, type: "profile" },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const theme = getTheme(profile.theme);

  return (
    <div className={cn("min-h-svh", theme.page)}>
      <main className="mx-auto flex max-w-md flex-col items-center gap-8 px-4 py-12">
        <ProfileHeader
          fullName={profile.full_name}
          profession={profile.profession}
          registration={profile.registration}
          bio={profile.bio}
          avatarUrl={profile.avatar_url}
          mutedClassName={theme.muted}
        />

        {profile.bookingEnabled && (
          <Link
            href={`/${profile.username}/agendar`}
            className={cn(
              "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-6 text-lg font-semibold shadow-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              theme.button,
            )}
          >
            <CalendarCheck className="size-5" aria-hidden="true" />
            Agendar
          </Link>
        )}

        {profile.socialLinks.length > 0 && (
          <nav aria-label="Links" className="flex w-full flex-col gap-3">
            {profile.socialLinks.map((link) => (
              <SocialCard key={link.id} platform={link.platform} label={link.label} url={link.url} className={theme.card} />
            ))}
          </nav>
        )}

        <footer className={cn("pt-4 text-xs", theme.muted)}>
          <Link href="/" className="hover:underline">
            Feito com agenda.me
          </Link>
        </footer>
      </main>
    </div>
  );
}
