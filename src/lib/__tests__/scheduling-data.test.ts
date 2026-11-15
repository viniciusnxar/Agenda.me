import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const { localDaysRange, resolvePlan } = await import("@/lib/scheduling-data");

const plans = [{ id: "11111111-1111-4111-8111-111111111111", name: "Unimed" }];
const on = { plans_enabled: true, require_plan: false, allow_private: true };

describe("resolvePlan", () => {
  it("planos desligados ignoram a escolha", () => {
    expect(resolvePlan(plans[0].id, { ...on, plans_enabled: false }, plans)).toEqual({ ok: true, planId: null, planName: null });
  });

  it("plano ativo do profissional", () => {
    expect(resolvePlan(plans[0].id, on, plans)).toEqual({ ok: true, planId: plans[0].id, planName: "Unimed" });
  });

  it("plano de outro profissional ou inativo é recusado", () => {
    expect(resolvePlan("22222222-2222-4222-8222-222222222222", on, plans).ok).toBe(false);
  });

  it("particular só quando permitido", () => {
    expect(resolvePlan("private", on, plans)).toEqual({ ok: true, planId: null, planName: "Particular" });
    expect(resolvePlan("private", { ...on, allow_private: false }, plans).ok).toBe(false);
  });

  it("sem escolha: ok, a não ser que o plano seja obrigatório", () => {
    expect(resolvePlan(undefined, on, plans)).toEqual({ ok: true, planId: null, planName: null });
    expect(resolvePlan(undefined, { ...on, require_plan: true }, plans).ok).toBe(false);
  });
});

describe("localDaysRange", () => {
  it("cobre os dias locais inteiros no fuso", () => {
    const { from, to } = localDaysRange("2026-12-01", "2026-12-31", "America/Fortaleza");
    expect(from.toISOString()).toBe("2026-12-01T03:00:00.000Z");
    expect(to.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });
});
