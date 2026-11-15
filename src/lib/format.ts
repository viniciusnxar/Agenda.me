export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Máscara progressiva para input: "12345678909" -> "123.456.789-09"
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

// CPF para listagens (LGPD): só os 6 dígitos do meio aparecem
export function maskCpf(value: string): string {
  const d = onlyDigits(value);
  if (d.length !== 11) return "***.***.***-**";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

// Telefone BR, com ou sem 55, com máscara progressiva para input.
// "85999990000" -> "(85) 99999-0000", "8533330000" -> "(85) 3333-0000"
export function formatPhone(value: string): string {
  let d = onlyDigits(value);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + JSON.stringify(options);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("pt-BR", { timeZone, ...options });
    formatters.set(key, f);
  }
  return f;
}

type DateInput = Date | string;
const toDate = (value: DateInput) => (typeof value === "string" ? new Date(value) : value);

// "01/12/2026"
export function formatDate(value: DateInput, timeZone: string): string {
  return formatter(timeZone, { day: "2-digit", month: "2-digit", year: "numeric" }).format(toDate(value));
}

// "21:30"
export function formatTime(value: DateInput, timeZone: string): string {
  return formatter(timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(toDate(value));
}

// "terça-feira, 1 de dezembro de 2026"
export function formatDateLong(value: DateInput, timeZone: string): string {
  return formatter(timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    toDate(value),
  );
}

// "01/12/2026 às 21:30"
export function formatDateTime(value: DateInput, timeZone: string): string {
  return `${formatDate(value, timeZone)} às ${formatTime(value, timeZone)}`;
}
