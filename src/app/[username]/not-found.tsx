import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Perfil não encontrado</h1>
        <p className="text-muted-foreground">Esse endereço não existe ou a página ainda não foi publicada.</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Conhecer o agenda.me</Link>
      </Button>
    </main>
  );
}
