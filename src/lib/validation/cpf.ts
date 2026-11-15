import { onlyDigits } from "@/lib/format";

function checkDigit(digits: string, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

// CPF válido: 11 dígitos, não repetidos, com os dois dígitos verificadores corretos.
export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  return checkDigit(d, 9) === Number(d[9]) && checkDigit(d, 10) === Number(d[10]);
}
