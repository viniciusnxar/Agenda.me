import { ImageResponse } from "next/og";

import { getPublicProfile } from "@/lib/public-profile";
import { getTheme } from "@/lib/theme";

export const alt = "Página no agenda.me";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  const { og } = getTheme(profile?.theme);

  const name = profile?.full_name ?? "agenda.me";
  const subtitle = profile ? [profile.profession, profile.registration].filter(Boolean).join(" · ") : "";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: og.background,
          color: og.foreground,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 9999,
            background: og.accent,
            color: og.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 700,
          }}
        >
          {initials}
        </div>
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 700 }}>{name}</div>
        {subtitle && <div style={{ marginTop: 12, fontSize: 32, opacity: 0.7 }}>{subtitle}</div>}
        <div style={{ marginTop: 48, fontSize: 28, color: og.accent }}>Agende sua consulta online · agenda.me</div>
      </div>
    ),
    size,
  );
}
