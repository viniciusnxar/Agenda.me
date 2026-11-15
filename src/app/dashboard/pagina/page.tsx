import type { Metadata } from "next";

import { PageEditor } from "@/components/dashboard/page-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireProfile } from "@/lib/auth";
import { isPlatform, type Platform } from "@/lib/social";

export const metadata: Metadata = { title: "Minha página" };

export default async function PageEditorPage() {
  const { profile, supabase } = await requireProfile();

  const { data: links } = await supabase
    .from("social_links")
    .select("id, platform, label, url, is_active")
    .eq("profile_id", profile.id)
    .order("position");

  return (
    <div className="grid gap-6">
      <PageHeader title="Minha página" description="Foto, bio, tema e links que aparecem na sua página pública." />
      <PageEditor
        profile={profile}
        links={(links ?? [])
          .filter((l) => isPlatform(l.platform))
          .map((l) => ({ ...l, platform: l.platform as Platform }))}
      />
    </div>
  );
}
