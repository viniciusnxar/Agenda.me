"use client";

import type { SlotOption } from "@/app/[username]/agendar/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SlotPickerProps = {
  slots: SlotOption[];
  selected: string | null;
  onSelect: (slot: SlotOption) => void;
  loading?: boolean;
};

export function SlotPicker({ slots, selected, onSelect, loading }: SlotPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Carregando horários">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Nenhum horário livre nesse dia. Escolha outro.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Horários disponíveis">
      {slots.map((slot) => (
        <Button
          key={slot.start}
          type="button"
          variant={slot.start === selected ? "default" : "outline"}
          aria-pressed={slot.start === selected}
          onClick={() => onSelect(slot)}
        >
          {slot.label}
        </Button>
      ))}
    </div>
  );
}
