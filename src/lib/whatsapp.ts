import { onlyDigits } from "@/lib/format";

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Olá! Gostaria de agendar para {data} às {hora}. Nome: {nome}. Plano: {plano}.";

export type WhatsAppVars = {
  nome?: string;
  data?: string;
  hora?: string;
  plano?: string;
};

// Troca {nome} {data} {hora} {plano}; variável sem valor vira texto vazio.
export function fillTemplate(template: string, vars: WhatsAppVars): string {
  return template.replace(/\{(nome|data|hora|plano)\}/g, (_, key: keyof WhatsAppVars) => vars[key]?.trim() ?? "");
}

// Número no formato do wa.me: só dígitos, com DDI 55. Telefone BR tem 10 ou 11 dígitos.
export function toWhatsAppNumber(phone: string): string {
  const d = onlyDigits(phone);
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

export function buildWhatsAppLink(phone: string, message?: string): string {
  const base = `https://wa.me/${toWhatsAppNumber(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
