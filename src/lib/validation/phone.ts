import { onlyDigits } from "@/lib/format";

// Telefone BR em dígitos nacionais (DDD + número), aceitando entrada com +55 e máscara.
// Celular: 11 dígitos começando com 9 depois do DDD. Fixo: 10 dígitos começando com 2 a 5.
export function normalizePhone(value: string): string | null {
  let d = onlyDigits(value);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (!/^[1-9][1-9]/.test(d)) return null;
  if (d.length === 11 && d[2] === "9") return d;
  if (d.length === 10 && /[2-5]/.test(d[2])) return d;
  return null;
}

export function isValidPhone(value: string): boolean {
  return normalizePhone(value) !== null;
}
