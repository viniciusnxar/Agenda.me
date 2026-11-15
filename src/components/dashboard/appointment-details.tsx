"use client";

import { Check, CircleSlash, Loader2, MessageCircle, UserX, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateAppointmentStatus, type StatusAction } from "@/app/dashboard/actions";
import { AppointmentStatusBadge } from "@/components/public/appointment-summary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPhone } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type AppointmentDetailsData = {
  id: string;
  status: string;
  source: string;
  client_name: string;
  client_phone: string;
  /** já mascarado na agenda; completo só na página de detalhe */
  cpf: string | null;
  plan_name: string | null;
  notes: string | null;
  /** textos já formatados no fuso do profissional */
  dateLabel: string;
  timeLabel: string;
};

const SOURCE_LABEL: Record<string, string> = {
  booking: "Página de agendamento",
  whatsapp: "Pedido via WhatsApp",
  manual: "Criado por você",
};

const ACTIONS: Record<string, { action: StatusAction; label: string; icon: typeof Check; variant?: "outline" }[]> = {
  pending: [{ action: "confirm", label: "Confirmar", icon: Check }],
  confirmed: [
    { action: "complete", label: "Concluir", icon: Check },
    { action: "no_show", label: "Faltou", icon: UserX, variant: "outline" },
  ],
};

export function AppointmentDetails({ appointment: a }: { appointment: AppointmentDetailsData }) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<StatusAction | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  function run(action: StatusAction) {
    setRunning(action);
    startTransition(async () => {
      const result = await updateAppointmentStatus(a.id, action);
      setRunning(null);
      setConfirmCancel(false);
      // a action revalida o painel; o novo status chega pelas props
      if (result.ok) toast.success("Agendamento atualizado");
      else toast.error(result.error);
    });
  }

  const canCancel = a.status === "pending" || a.status === "confirmed";

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold first-letter:uppercase">{a.dateLabel}</p>
          <p className="text-sm text-muted-foreground">{a.timeLabel}</p>
        </div>
        <AppointmentStatusBadge status={a.status} />
      </div>

      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Paciente</dt>
        <dd className="font-medium">{a.client_name}</dd>
        <dt className="text-muted-foreground">Telefone</dt>
        <dd>{formatPhone(a.client_phone)}</dd>
        {a.cpf && (
          <>
            <dt className="text-muted-foreground">CPF</dt>
            <dd className="tabular-nums">{a.cpf}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Plano</dt>
        <dd>{a.plan_name ?? "Não informado"}</dd>
        <dt className="text-muted-foreground">Origem</dt>
        <dd>{SOURCE_LABEL[a.source] ?? a.source}</dd>
        {a.notes && (
          <>
            <dt className="text-muted-foreground">Observações</dt>
            <dd className="whitespace-pre-line">{a.notes}</dd>
          </>
        )}
      </dl>

      <Button asChild variant="outline">
        <a href={buildWhatsAppLink(a.client_phone)} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" /> Abrir WhatsApp
        </a>
      </Button>

      {(ACTIONS[a.status] || canCancel) && (
        <div className="flex flex-wrap gap-2">
          {ACTIONS[a.status]?.map(({ action, label, icon: Icon, variant }) => (
            <Button key={action} variant={variant} onClick={() => run(action)} disabled={pending}>
              {running === action ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
              {label}
            </Button>
          ))}
          {canCancel && (
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmCancel(true)} disabled={pending}>
              <X aria-hidden="true" /> Cancelar
            </Button>
          )}
        </div>
      )}

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar agendamento?</DialogTitle>
            <DialogDescription>
              O horário volta a ficar livre. Avise {a.client_name.split(" ")[0]} pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>
                Manter
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => run("cancel")} disabled={pending}>
              {running === "cancel" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CircleSlash aria-hidden="true" />}
              Sim, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
