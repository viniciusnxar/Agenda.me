import { z } from "zod";

import { onlyDigits } from "@/lib/format";
import { isValidCpf } from "@/lib/validation/cpf";
import { normalizePhone } from "@/lib/validation/phone";

// Os limites espelham as constraints de supabase/migrations/0001_init.sql.

// Rotas do app que não podem virar /<username>
export const RESERVED_USERNAMES = [
  "admin", "api", "app", "auth", "c", "cadastro", "dashboard", "login", "logout",
  "onboarding", "privacidade", "robots", "sitemap", "static", "www",
] as const;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9_-]{2,29}$/,
    "Use de 3 a 30 caracteres: letras minúsculas, números, - ou _, começando com letra ou número",
  )
  .refine((v) => !(RESERVED_USERNAMES as readonly string[]).includes(v), "Esse nome de usuário não está disponível");

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizePhone(v) !== null, "Telefone inválido. Use DDD + número")
  .transform((v) => normalizePhone(v)!);

export const cpfSchema = z
  .string()
  .trim()
  .refine(isValidCpf, "CPF inválido")
  .transform(onlyDigits);

// Texto opcional: vazio vira null (formato do banco)
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => v || null);

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const timezoneSchema = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}, "Fuso horário inválido");

// ---------------------------------------------------------------------------
// Perfil (página pública)
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  profession: optionalText(80, "Máximo de 80 caracteres"),
  registration: optionalText(40, "Máximo de 40 caracteres"),
  bio: optionalText(500, "Máximo de 500 caracteres"),
  whatsapp: z.preprocess(emptyToUndefined, phoneSchema.optional()).transform((v) => v ?? null),
  timezone: timezoneSchema.default("America/Sao_Paulo"),
  theme: z.string().trim().min(1).max(30).default("default"),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Regras de agendamento (booking_settings)
// ---------------------------------------------------------------------------

export const WINDOW_MODES = ["flexible", "same_day_only", "next_day_only"] as const;

const int = (min: number, max: number, label: string) =>
  z.coerce
    .number()
    .int(`${label}: use um número inteiro`)
    .min(min, `${label}: mínimo ${min}`)
    .max(max, `${label}: máximo ${max}`);

export const bookingSettingsSchema = z
  .object({
    is_enabled: z.boolean(),
    slot_duration_min: int(5, 480, "Duração"),
    buffer_min: int(0, 240, "Intervalo"),
    window_mode: z.enum(WINDOW_MODES),
    min_advance_days: int(0, 365, "Antecedência mínima"),
    max_advance_days: int(0, 365, "Antecedência máxima"),
    min_notice_minutes: int(0, 10080, "Aviso mínimo"),
    max_per_day: z.preprocess(emptyToUndefined, int(1, 100, "Limite por dia").nullish()).transform((v) => v ?? null),
    auto_confirm: z.boolean(),
    require_cpf: z.boolean(),
    plans_enabled: z.boolean(),
    require_plan: z.boolean(),
    allow_private: z.boolean(),
    whatsapp_enabled: z.boolean(),
    whatsapp_hold_slot: z.boolean(),
    whatsapp_message_template: z
      .string()
      .trim()
      .min(1, "Escreva a mensagem")
      .max(500, "Máximo de 500 caracteres"),
  })
  .refine((s) => s.max_advance_days >= s.min_advance_days, {
    path: ["max_advance_days"],
    message: "A antecedência máxima precisa ser maior ou igual à mínima",
  });

export type BookingSettingsInput = z.input<typeof bookingSettingsSchema>;
export type BookingSettingsData = z.output<typeof bookingSettingsSchema>;

// ---------------------------------------------------------------------------
// Agendamento feito pelo cliente
// ---------------------------------------------------------------------------

export const PRIVATE_PLAN = "private"; // valor do select para "Particular"

export const appointmentSchema = z.object({
  starts_at: z.iso.datetime({ offset: true, message: "Horário inválido" }),
  client_name: z.string().trim().min(2, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  client_phone: phoneSchema,
  client_cpf: z.preprocess(emptyToUndefined, cpfSchema.optional()),
  plan_id: z.preprocess(emptyToUndefined, z.union([z.uuid("Plano inválido"), z.literal(PRIVATE_PLAN)]).optional()),
  notes: optionalText(500, "Máximo de 500 caracteres"),
  consent: z.literal(true, "É preciso concordar com o uso dos dados para agendar"),
  // honeypot: campo escondido que só robô preenche
  website: z.string().max(0).optional(),
});

export type AppointmentInput = z.input<typeof appointmentSchema>;
export type AppointmentData = z.output<typeof appointmentSchema>;

// Regras que dependem do profissional (CPF e plano obrigatórios)
export function appointmentSchemaFor(settings: { require_cpf: boolean; require_plan: boolean }) {
  return appointmentSchema.superRefine((data, ctx) => {
    if (settings.require_cpf && !data.client_cpf) {
      ctx.addIssue({ code: "custom", path: ["client_cpf"], message: "Informe o CPF" });
    }
    if (settings.require_plan && !data.plan_id) {
      ctx.addIssue({ code: "custom", path: ["plan_id"], message: "Escolha um plano" });
    }
  });
}
