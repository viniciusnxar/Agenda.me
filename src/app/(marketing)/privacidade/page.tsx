import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o AgendaLink trata os dados de profissionais e pacientes.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto max-w-3xl px-4 py-4">
        <Link href="/" aria-label="Voltar ao início">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 pt-6 pb-16 leading-relaxed">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de privacidade</h1>
          <p className="mt-2 text-muted-foreground">
            Esta página explica, de forma simples, quais dados o AgendaLink coleta e como eles são usados, conforme
            a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Quem é quem</h2>
          <p>
            O <strong>profissional</strong> que publica a página é o controlador dos dados dos seus pacientes: é ele
            quem decide como atender e entrar em contato. O AgendaLink é o operador: guarda os dados e os entrega
            somente a esse profissional.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Dados que coletamos</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Do paciente, ao agendar:</strong> nome, telefone, CPF (quando o profissional exige), plano ou
              convênio, observações e a data e hora escolhidas.
            </li>
            <li>
              <strong>Do profissional:</strong> e-mail de acesso, nome, profissão, registro profissional, foto, bio,
              WhatsApp e links das redes sociais que ele decidir publicar.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Para que usamos</h2>
          <p>
            Os dados do paciente servem apenas para registrar o agendamento e permitir que o profissional confirme,
            remarque ou cancele o atendimento. Não vendemos dados e não os usamos para publicidade. O agendamento só
            é feito com o consentimento do paciente, marcado no formulário.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Quem vê os dados</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Somente o profissional com quem a consulta foi agendada.</li>
            <li>Na lista de agendamentos o CPF aparece mascarado; o número completo só aparece no detalhe.</li>
            <li>O CPF não é gravado em registros de erro nem em mensagens do sistema.</li>
            <li>A página pública mostra apenas os horários ocupados, nunca quem agendou.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Seus direitos</h2>
          <p>
            O paciente pode ver ou cancelar o próprio agendamento pelo link recebido ao agendar. Para acessar,
            corrigir ou excluir seus dados, fale diretamente com o profissional com quem agendou.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Segurança</h2>
          <p>
            Os dados ficam em banco de dados com controle de acesso por usuário e conexão criptografada (HTTPS). Cada
            profissional acessa somente a própria agenda.
          </p>
        </section>
      </main>
    </div>
  );
}
