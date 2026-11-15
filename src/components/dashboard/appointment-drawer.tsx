"use client";

import Link from "next/link";

import { AppointmentDetails, type AppointmentDetailsData } from "@/components/dashboard/appointment-details";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AppointmentDrawer({
  appointment,
  onClose,
}: {
  appointment: AppointmentDetailsData | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={appointment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {appointment && (
          <>
            <SheetHeader>
              <SheetTitle>{appointment.client_name}</SheetTitle>
              <SheetDescription>Detalhes do agendamento</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4 pb-6">
              <AppointmentDetails key={appointment.id + appointment.status} appointment={appointment} />
              <Button asChild variant="link" className="justify-self-start px-0">
                <Link href={`/dashboard/agendamentos/${appointment.id}`}>Ver página completa (com CPF)</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
