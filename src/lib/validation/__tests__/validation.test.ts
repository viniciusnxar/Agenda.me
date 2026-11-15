import { describe, expect, it } from "vitest";

import { isValidCpf } from "@/lib/validation/cpf";
import { isValidPhone, normalizePhone } from "@/lib/validation/phone";
import {
  appointmentSchema,
  appointmentSchemaFor,
  exceptionSchema,
  findOverlap,
  bookingSettingsSchema,
  profileSchema,
  usernameSchema,
  weeklyRuleSchema,
  weeklyRulesSchema,
} from "@/lib/validation/schemas";

describe("isValidCpf", () => {
  it("aceita CPF válido com e sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("12345678909")).toBe(true);
  });
  it("recusa dígito verificador errado", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("12345678919")).toBe(false);
  });
  it("recusa dígitos repetidos e tamanho errado", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("000.000.000-00")).toBe(false);
    expect(isValidCpf("1234567890")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});

describe("telefone", () => {
  it("normaliza celular e fixo", () => {
    expect(normalizePhone("(85) 99999-0000")).toBe("85999990000");
    expect(normalizePhone("+55 85 99999-0000")).toBe("85999990000");
    expect(normalizePhone("(85) 3333-0000")).toBe("8533330000");
    expect(normalizePhone("558533330000")).toBe("8533330000");
  });
  it("recusa números inválidos", () => {
    expect(isValidPhone("85 89999-0000")).toBe(false); // celular sem 9
    expect(isValidPhone("85 9999-0000")).toBe(false); // fixo começando com 9
    expect(isValidPhone("(01) 99999-0000")).toBe(false); // DDD inválido
    expect(isValidPhone("99999-0000")).toBe(false); // sem DDD
    expect(isValidPhone("")).toBe(false);
  });
});

describe("usernameSchema", () => {
  it("normaliza para minúsculo", () => {
    expect(usernameSchema.parse("  Dra-Ana ")).toBe("dra-ana");
  });
  it("recusa formato inválido e nomes reservados", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("-ana").success).toBe(false);
    expect(usernameSchema.safeParse("ana souza").success).toBe(false);
    expect(usernameSchema.safeParse("dashboard").success).toBe(false);
    expect(usernameSchema.safeParse("Login").success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("vazios viram null e whatsapp é normalizado", () => {
    const data = profileSchema.parse({ full_name: " Ana ", bio: "  ", whatsapp: "(85) 99999-0000" });
    expect(data).toMatchObject({
      full_name: "Ana",
      bio: null,
      profession: null,
      whatsapp: "85999990000",
      timezone: "America/Sao_Paulo",
    });
  });
  it("whatsapp vazio é null; inválido dá erro", () => {
    expect(profileSchema.parse({ full_name: "Ana", whatsapp: "" }).whatsapp).toBeNull();
    expect(profileSchema.safeParse({ full_name: "Ana", whatsapp: "123" }).success).toBe(false);
  });
  it("recusa fuso inexistente", () => {
    expect(profileSchema.safeParse({ full_name: "Ana", timezone: "Lua/Base" }).success).toBe(false);
  });
});

const settings = {
  is_enabled: true,
  slot_duration_min: 50,
  buffer_min: 10,
  window_mode: "flexible",
  min_advance_days: 0,
  max_advance_days: 30,
  min_notice_minutes: 120,
  max_per_day: "",
  auto_confirm: false,
  require_cpf: false,
  plans_enabled: false,
  require_plan: false,
  allow_private: true,
  whatsapp_enabled: false,
  whatsapp_hold_slot: false,
  whatsapp_message_template: "Olá {nome}",
};

describe("bookingSettingsSchema", () => {
  it("aceita regras válidas e converte números de input", () => {
    const data = bookingSettingsSchema.parse({ ...settings, slot_duration_min: "40" });
    expect(data.slot_duration_min).toBe(40);
    expect(data.max_per_day).toBeNull();
  });
  it("recusa valores fora dos limites do banco", () => {
    expect(bookingSettingsSchema.safeParse({ ...settings, slot_duration_min: 4 }).success).toBe(false);
    expect(bookingSettingsSchema.safeParse({ ...settings, buffer_min: -1 }).success).toBe(false);
    expect(bookingSettingsSchema.safeParse({ ...settings, max_per_day: 0 }).success).toBe(false);
    expect(bookingSettingsSchema.safeParse({ ...settings, window_mode: "always" }).success).toBe(false);
  });
  it("max_advance_days não pode ser menor que min_advance_days", () => {
    const r = bookingSettingsSchema.safeParse({ ...settings, min_advance_days: 5, max_advance_days: 2 });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["max_advance_days"]);
  });
});

const appointment = {
  starts_at: "2026-12-01T14:00:00-03:00",
  client_name: "Maria Silva",
  client_phone: "(85) 99999-0000",
  client_cpf: "",
  plan_id: "",
  notes: "",
  consent: true,
  website: "",
};

describe("appointmentSchema", () => {
  it("normaliza telefone e CPF, vazios somem", () => {
    const data = appointmentSchema.parse({ ...appointment, client_cpf: "529.982.247-25" });
    expect(data).toMatchObject({
      client_phone: "85999990000",
      client_cpf: "52998224725",
      plan_id: undefined,
      notes: null,
    });
  });
  it("exige consentimento", () => {
    expect(appointmentSchema.safeParse({ ...appointment, consent: false }).success).toBe(false);
  });
  it("recusa honeypot preenchido", () => {
    expect(appointmentSchema.safeParse({ ...appointment, website: "spam.com" }).success).toBe(false);
  });
  it("recusa CPF inválido mesmo opcional", () => {
    expect(appointmentSchema.safeParse({ ...appointment, client_cpf: "111.111.111-11" }).success).toBe(false);
  });
  it("plan_id aceita uuid ou particular", () => {
    expect(appointmentSchema.safeParse({ ...appointment, plan_id: "private" }).success).toBe(true);
    expect(
      appointmentSchema.safeParse({ ...appointment, plan_id: "9b2c6c1e-4a5e-4d8a-9f3a-2b1c0d9e8f7a" }).success,
    ).toBe(true);
    expect(appointmentSchema.safeParse({ ...appointment, plan_id: "qualquer" }).success).toBe(false);
  });
  it("recusa horário sem fuso", () => {
    expect(appointmentSchema.safeParse({ ...appointment, starts_at: "2026-12-01 14:00" }).success).toBe(false);
  });
});

describe("appointmentSchemaFor", () => {
  it("exige CPF e plano quando o profissional pede", () => {
    const r = appointmentSchemaFor({ require_cpf: true, require_plan: true }).safeParse(appointment);
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual(["client_cpf", "plan_id"]);
  });
  it("passa quando não exige", () => {
    expect(appointmentSchemaFor({ require_cpf: false, require_plan: false }).safeParse(appointment).success).toBe(
      true,
    );
  });
});

describe("horários semanais", () => {
  it("aceita intervalos válidos, inclusive encostados", () => {
    const rules = [
      { weekday: 1, start_time: "08:00", end_time: "12:00" },
      { weekday: 1, start_time: "12:00", end_time: "14:00" },
      { weekday: 2, start_time: "08:00", end_time: "12:00" },
    ];
    expect(weeklyRulesSchema.safeParse(rules).success).toBe(true);
  });
  it("recusa fim antes do início e horário inválido", () => {
    expect(weeklyRuleSchema.safeParse({ weekday: 1, start_time: "12:00", end_time: "08:00" }).success).toBe(false);
    expect(weeklyRuleSchema.safeParse({ weekday: 1, start_time: "08:00", end_time: "08:00" }).success).toBe(false);
    expect(weeklyRuleSchema.safeParse({ weekday: 1, start_time: "8:00", end_time: "12:00" }).success).toBe(false);
    expect(weeklyRuleSchema.safeParse({ weekday: 7, start_time: "08:00", end_time: "12:00" }).success).toBe(false);
  });
  it("recusa sobreposição no mesmo dia, em qualquer ordem", () => {
    const rules = [
      { weekday: 3, start_time: "14:00", end_time: "18:00" },
      { weekday: 3, start_time: "08:00", end_time: "15:00" },
    ];
    expect(findOverlap(rules)).toEqual(rules[0]);
    expect(weeklyRulesSchema.safeParse(rules).success).toBe(false);
    expect(findOverlap([rules[0], { ...rules[1], weekday: 4 }])).toBeNull();
  });
});

describe("exceptionSchema", () => {
  it("dia bloqueado não precisa de horário", () => {
    expect(exceptionSchema.parse({ is_blocked: true, date: "2026-12-25", reason: "" })).toEqual({
      is_blocked: true,
      date: "2026-12-25",
      reason: null,
    });
  });
  it("horário especial precisa de intervalo válido", () => {
    expect(
      exceptionSchema.safeParse({ is_blocked: false, date: "2026-12-24", start_time: "08:00", end_time: "12:00" }).success,
    ).toBe(true);
    expect(
      exceptionSchema.safeParse({ is_blocked: false, date: "2026-12-24", start_time: "12:00", end_time: "08:00" }).success,
    ).toBe(false);
    expect(exceptionSchema.safeParse({ is_blocked: false, date: "2026-12-24" }).success).toBe(false);
  });
  it("recusa data inválida", () => {
    expect(exceptionSchema.safeParse({ is_blocked: true, date: "2026-13-01" }).success).toBe(false);
  });
});
