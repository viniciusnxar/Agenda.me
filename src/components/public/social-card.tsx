import { PlatformIcon } from "@/components/public/platform-icon";
import { socialLabel, toSocialHref, type Platform } from "@/lib/social";
import { cn } from "@/lib/utils";

type SocialCardProps = {
  platform: Platform;
  label: string | null;
  url: string;
  className?: string;
};

/** Card de link centralizado, estilo Linktree. Links inválidos não são exibidos. */
export function SocialCard({ platform, label, url, className }: SocialCardProps) {
  const href = toSocialHref(platform, url);
  if (!href) return null;

  const external = !href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "relative flex min-h-14 w-full items-center justify-center rounded-xl border px-12 py-3 text-center font-medium shadow-xs transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <PlatformIcon platform={platform} className="absolute left-4 size-5" />
      <span className="break-words">{socialLabel(platform, label)}</span>
    </a>
  );
}
