import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppUrl, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Criar sua página" };

export default async function OnboardingPage() {
  const user = await requireUser();

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Logo />
      <main className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Crie sua página</CardTitle>
            <CardDescription>Escolha o endereço e os dados principais. O resto você ajusta no painel.</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm appHost={getAppUrl().replace(/^https?:\/\//, "")} />
          </CardContent>
        </Card>
      </main>
      <form action={signOut}>
        <Button type="submit" variant="link" size="sm" className="text-muted-foreground">
          Sair ({user.email})
        </Button>
      </form>
    </div>
  );
}
