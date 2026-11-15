export const PLATFORMS = ["instagram", "tiktok", "youtube", "linkedin", "facebook", "site", "email", "outro"] as const;

export type Platform = (typeof PLATFORMS)[number];

type PlatformInfo = {
  label: string;
  placeholder: string;
  /** Domínio usado quando a pessoa digita só o @usuario */
  profileBase?: string;
};

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  instagram: { label: "Instagram", placeholder: "@seuperfil", profileBase: "https://instagram.com/" },
  tiktok: { label: "TikTok", placeholder: "@seuperfil", profileBase: "https://tiktok.com/@" },
  youtube: { label: "YouTube", placeholder: "@seucanal", profileBase: "https://youtube.com/@" },
  linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/voce" },
  facebook: { label: "Facebook", placeholder: "https://facebook.com/suapagina", profileBase: "https://facebook.com/" },
  site: { label: "Site", placeholder: "https://seusite.com.br" },
  email: { label: "E-mail", placeholder: "voce@email.com" },
  outro: { label: "Link", placeholder: "https://..." },
};

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

/**
 * Transforma o que a pessoa digitou num link clicável:
 * "@ana" no Instagram -> https://instagram.com/ana; "ana@x.com" em e-mail -> mailto:ana@x.com;
 * "meusite.com" -> https://meusite.com. Esquemas perigosos (javascript:, data:) viram null.
 */
export function toSocialHref(platform: Platform, value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  if (platform === "email") {
    const email = v.replace(/^mailto:/i, "");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
  }

  const base = PLATFORM_INFO[platform].profileBase;
  // "@ana.souza" ou "ana" (sem ponto, então não é domínio) -> perfil na rede
  if (base && /^@?[\w.-]+$/.test(v) && (v.startsWith("@") || !v.includes("."))) {
    return base + v.replace(/^@/, "");
  }

  if (/^https?:\/\//i.test(v)) return safeUrl(v);
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null; // outro esquema (javascript:, data:, ...)
  return safeUrl(`https://${v}`);
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Texto do card: o rótulo escolhido ou o nome da rede. */
export function socialLabel(platform: Platform, label: string | null): string {
  return label?.trim() || PLATFORM_INFO[platform].label;
}
