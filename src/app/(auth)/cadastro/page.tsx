import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPostLoginPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await getPostLoginPath(supabase, user.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>Em seguida você escolhe o endereço da sua página.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Já tem conta?&nbsp;
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </CardFooter>
    </Card>
  );
}
