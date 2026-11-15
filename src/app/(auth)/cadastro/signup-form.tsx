"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { signUp } from "../actions";

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);

  if (state?.ok) {
    return (
      <Alert role="status">
        <AlertDescription>{state.data.message}</AlertDescription>
      </Alert>
    );
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="grid gap-4">
      <FormField label="E-mail" name="email" type="email" autoComplete="email" required errors={errors?.email} />
      <FormField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Pelo menos 8 caracteres."
        errors={errors?.password}
      />
      {state && !state.ok && !state.fieldErrors && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <SubmitButton pendingText="Criando conta...">Criar conta</SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        Ao criar a conta você concorda com a{" "}
        <Link href="/privacidade" className="underline underline-offset-4">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}
