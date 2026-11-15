"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Algo deu errado</h1>
        <p className="text-muted-foreground">Tente novamente em alguns instantes.</p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
