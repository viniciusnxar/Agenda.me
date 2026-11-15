"use client";

import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  History,
  LayoutDashboard,
  Menu,
  PanelsTopLeft,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumo", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/pagina", label: "Minha página", icon: PanelsTopLeft },
  { href: "/dashboard/disponibilidade", label: "Disponibilidade", icon: CalendarClock },
  { href: "/dashboard/regras", label: "Regras", icon: SlidersHorizontal },
  { href: "/dashboard/planos", label: "Planos", icon: CreditCard },
  { href: "/dashboard/historico", label: "Histórico", icon: History },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1" aria-label="Painel">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Menu lateral fixo no desktop. */
export function DashboardNav() {
  return <NavLinks />;
}

/** Menu em gaveta no celular. */
export function MobileDashboardNav({ footer }: { footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetHeader className="px-0">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <NavLinks onNavigate={() => setOpen(false)} />
        {footer && <div className="mt-auto">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
