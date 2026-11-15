"use client";

import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { sendMagicLink, signIn, type AuthState } from "../actions";

function FormMessage({ state }: { state: AuthState }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <Alert role="status">
        <AlertDescription>{state.data.message}</AlertDescription>
      </Alert>
    );
  }
  return state.fieldErrors ? null : (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

const fieldErrors = (state: AuthState) => (state && !state.ok ? state.fieldErrors : undefined);

export function LoginForm({ next }: { next: string }) {
  const [passwordState, passwordAction] = useActionState(signIn, null);
  const [linkState, linkAction] = useActionState(sendMagicLink, null);

  return (
    <Tabs defaultValue="password">
      <TabsList className="w-full">
        <TabsTrigger value="password">Senha</TabsTrigger>
        <TabsTrigger value="magic-link">Link por e-mail</TabsTrigger>
      </TabsList>

      <TabsContent value="password">
        <form action={passwordAction} className="grid gap-4 pt-2">
          <input type="hidden" name="next" value={next} />
          <FormField
            label="E-mail"
            name="email"
            id="password-email"
            type="email"
            autoComplete="email"
            required
            errors={fieldErrors(passwordState)?.email}
          />
          <FormField
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            errors={fieldErrors(passwordState)?.password}
          />
          <FormMessage state={passwordState} />
          <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
        </form>
      </TabsContent>

      <TabsContent value="magic-link">
        <form action={linkAction} className="grid gap-4 pt-2">
          <input type="hidden" name="next" value={next} />
          <FormField
            label="E-mail"
            name="email"
            id="link-email"
            type="email"
            autoComplete="email"
            required
            hint="Enviamos um link que faz o login sem senha."
            errors={fieldErrors(linkState)?.email}
          />
          <FormMessage state={linkState} />
          <SubmitButton pendingText="Enviando...">Enviar link</SubmitButton>
        </form>
      </TabsContent>
    </Tabs>
  );
}
