"use client";

import { Check, Loader2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/format";

import { checkUsername, createProfile, type UsernameCheck } from "./actions";

export function OnboardingForm({ appHost }: { appHost: string }) {
  const [state, action] = useActionState(createProfile, null);
  const [username, setUsername] = useState("");
  const [check, setCheck] = useState<UsernameCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");

  // confere a disponibilidade 400 ms depois que a pessoa para de digitar
  useEffect(() => {
    if (username.length < 3) {
      setCheck(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      const result = await checkUsername(username);
      if (!cancelled) {
        setCheck(result);
        setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const usernameError = errors?.username?.[0] ?? (check && !check.available ? check.message : undefined);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="username">Endereço da sua página</Label>
        <div className="flex items-center rounded-md border focus-within:ring-[3px] focus-within:ring-ring/50">
          <span className="pl-3 text-sm text-muted-foreground select-none">{appHost}/</span>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={30}
            required
            placeholder="dra-ana"
            className="border-0 pl-0.5 shadow-none focus-visible:ring-0"
            aria-invalid={usernameError ? true : undefined}
            aria-describedby="username-status"
          />
        </div>
        <p
          id="username-status"
          aria-live="polite"
          className={`flex items-center gap-1 text-sm ${usernameError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {checking ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Verificando...
            </>
          ) : usernameError ? (
            <>
              <X className="size-3.5" aria-hidden="true" /> {usernameError}
            </>
          ) : check?.available ? (
            <>
              <Check className="size-3.5 text-green-600" aria-hidden="true" /> {check.message}
            </>
          ) : (
            "Letras minúsculas, números, - ou _. Não dá para trocar depois com facilidade."
          )}
        </p>
      </div>

      <FormField label="Nome que aparece na página" name="full_name" autoComplete="name" required errors={errors?.full_name} />
      <FormField
        label="Profissão"
        name="profession"
        placeholder="Psicóloga, nutricionista..."
        errors={errors?.profession}
      />
      <FormField
        label="WhatsApp"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(85) 99999-0000"
        value={whatsapp}
        onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
        hint="Opcional. Usado no botão de agendar pelo WhatsApp."
        errors={errors?.whatsapp}
      />

      {state && !state.ok && !state.fieldErrors && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <SubmitButton pendingText="Criando sua página..." disabled={checking || check?.available === false}>
        Continuar
      </SubmitButton>
    </form>
  );
}
