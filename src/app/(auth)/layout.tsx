import Link from "next/link";

import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Link href="/" aria-label="Voltar ao início">
        <Logo />
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
