import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { AppointmentStatusBadge, APPOINTMENT_STATUS } from "@/components/public/appointment-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { requireProfile } from "@/lib/auth";
import { formatDate, formatPhone, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Histórico" };

const PAGE_SIZE = 20;

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function HistoryPage({ searchParams }: Props) {
  const { profile, supabase } = await requireProfile();
  const params = await searchParams;

  const status = params.status && params.status in APPOINTMENT_STATUS ? params.status : "";
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  let query = supabase
    .from("appointments")
    .select("id, starts_at, status, source, client_name, client_phone, plan_name", { count: "exact" })
    .eq("profile_id", profile.id)
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  // % e _ digitados viram literais na busca
  if (q) query = query.ilike("client_name", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);

  const { data, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tz = profile.timezone;

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/dashboard/historico?${sp}`;
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Histórico" description="Agendamentos que já passaram." />

      <form className="flex flex-wrap items-end gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder="Buscar paciente pelo nome" aria-label="Buscar paciente" className="max-w-xs" />
        <NativeSelect name="status" defaultValue={status} aria-label="Filtrar por status">
          <NativeSelectOption value="">Todos os status</NativeSelectOption>
          {Object.entries(APPOINTMENT_STATUS).map(([value, { label }]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {!data?.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="p-3 font-medium">Data</th>
                    <th scope="col" className="p-3 font-medium">Paciente</th>
                    <th scope="col" className="hidden p-3 font-medium md:table-cell">Telefone</th>
                    <th scope="col" className="hidden p-3 font-medium sm:table-cell">Plano</th>
                    <th scope="col" className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/50">
                      <td className="p-3 whitespace-nowrap tabular-nums">
                        {formatDate(a.starts_at, tz)} <span className="text-muted-foreground">{formatTime(a.starts_at, tz)}</span>
                      </td>
                      <td className="p-3">
                        <Link href={`/dashboard/agendamentos/${a.id}`} className="font-medium hover:underline">
                          {a.client_name}
                        </Link>
                      </td>
                      <td className="hidden p-3 whitespace-nowrap md:table-cell">{formatPhone(a.client_phone)}</td>
                      <td className="hidden p-3 sm:table-cell">{a.plan_name ?? "—"}</td>
                      <td className="p-3">
                        <AppointmentStatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Paginação">
          <Button variant="outline" size="icon" asChild={page > 1} disabled={page <= 1}>
            {page > 1 ? (
              <Link href={pageHref(page - 1)} aria-label="Página anterior">
                <ChevronLeft />
              </Link>
            ) : (
              <ChevronLeft aria-label="Página anterior" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {pages} · {total} agendamentos
          </span>
          <Button variant="outline" size="icon" asChild={page < pages} disabled={page >= pages}>
            {page < pages ? (
              <Link href={pageHref(page + 1)} aria-label="Próxima página">
                <ChevronRight />
              </Link>
            ) : (
              <ChevronRight aria-label="Próxima página" />
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
