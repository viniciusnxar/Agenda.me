import { CalendarCheck, Clock, Link2, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Link2,
    title: "Sua página de links",
    text: "Foto, bio, registro profissional e cards das suas redes, tudo num link só para a bio do Instagram.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda online",
    text: "O paciente escolhe o dia e o horário livres e agenda sem precisar criar conta.",
  },
  {
    icon: Clock,
    title: "Regras do seu jeito",
    text: "Duração da consulta, intervalo entre atendimentos, antecedência mínima e limite por dia.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp integrado",
    text: "O paciente pode pedir o horário pelo WhatsApp com a mensagem já preenchida.",
  },
  {
    icon: Smartphone,
    title: "Feito para o celular",
    text: "Página rápida e leve para quem chega pelo Instagram.",
  },
  {
    icon: ShieldCheck,
    title: "Dados protegidos",
    text: "Cada profissional vê só a própria agenda, com CPF mascarado e consentimento LGPD.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <Button asChild variant="ghost">
          <Link href="/login">Entrar</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Seu link da bio que também agenda consultas
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            Para psicólogos, médicos, nutricionistas e outros profissionais: uma página com suas redes e uma
            agenda que seus pacientes usam sozinhos.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/cadastro">Criar minha página grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} agenda.me</span>
          <Link href="/privacidade" className="hover:text-foreground hover:underline">
            Política de privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
