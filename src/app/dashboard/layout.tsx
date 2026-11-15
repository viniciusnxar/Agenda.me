import { LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { CopyLink } from "@/components/dashboard/copy-link";
import { DashboardNav, MobileDashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppUrl, requireProfile } from "@/lib/auth";

export const metadata = { title: "Painel", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireProfile();
  const publicUrl = `${getAppUrl()}/${profile.username}`;

  const accountFooter = (
    <div className="grid gap-3 border-t pt-4">
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Sua página</span>
          <Badge variant={profile.is_published ? "default" : "secondary"}>
            {profile.is_published ? "Publicada" : "Rascunho"}
          </Badge>
        </div>
        <CopyLink url={publicUrl} />
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <LogOut aria-hidden="true" />
          <span className="truncate">Sair ({user.email})</span>
        </Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-svh bg-muted/30 md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r bg-background p-4 md:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <DashboardNav />
        <div className="mt-auto">{accountFooter}</div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2 md:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <MobileDashboardNav footer={accountFooter} />
      </header>

      <main className="mx-auto w-full max-w-5xl p-4 md:p-8">{children}</main>
    </div>
  );
}
