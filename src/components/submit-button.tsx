"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string;
};

/** Botão de envio que se desabilita e mostra um spinner enquanto o form está enviando. */
export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
