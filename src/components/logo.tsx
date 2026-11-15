import { CalendarCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold", className)}>
      <CalendarCheck className="size-5 text-primary" aria-hidden="true" />
      AgendaLink
    </span>
  );
}
