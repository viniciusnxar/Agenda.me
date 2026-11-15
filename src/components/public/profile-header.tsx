import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ProfileHeaderProps = {
  fullName: string;
  profession: string | null;
  registration: string | null;
  bio: string | null;
  avatarUrl: string | null;
  mutedClassName?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export function ProfileHeader({ fullName, profession, registration, bio, avatarUrl, mutedClassName }: ProfileHeaderProps) {
  const subtitle = [profession, registration].filter(Boolean).join(" · ");

  return (
    <header className="flex flex-col items-center text-center">
      <Avatar className="size-24 border-4 border-white shadow-sm">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={`Foto de ${fullName}`} className="object-cover" />}
        <AvatarFallback className="text-2xl font-semibold">{initials(fullName)}</AvatarFallback>
      </Avatar>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-balance">{fullName}</h1>
      {subtitle && <p className={cn("mt-1 text-sm font-medium", mutedClassName)}>{subtitle}</p>}
      {bio && <p className={cn("mt-3 max-w-sm text-sm whitespace-pre-line text-pretty", mutedClassName)}>{bio}</p>}
    </header>
  );
}
