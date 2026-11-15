import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPostLoginPath, safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await getPostLoginPath(supabase, user.id, next));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Entrar</CardTitle>
        <CardDescription>Acesse o painel da sua página e da sua agenda.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error === "link" && (
          <Alert variant="destructive">
            <AlertDescription>O link expirou ou já foi usado. Peça um novo.</AlertDescription>
          </Alert>
        )}
        <LoginForm next={safeNextPath(next)} />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Ainda não tem conta?&nbsp;
        <Link href="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">
          Cadastre-se
        </Link>
      </CardFooter>
    </Card>
  );
}
