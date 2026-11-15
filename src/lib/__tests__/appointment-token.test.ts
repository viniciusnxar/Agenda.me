import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const { canCancel, isValidToken } = await import("@/lib/appointment-token");

describe("isValidToken", () => {
  it("aceita só 64 caracteres hexadecimais minúsculos", () => {
    expect(isValidToken("a".repeat(64))).toBe(true);
    expect(isValidToken("0123456789abcdef".repeat(4))).toBe(true);
    expect(isValidToken("A".repeat(64))).toBe(false);
    expect(isValidToken("a".repeat(63))).toBe(false);
    expect(isValidToken("g".repeat(64))).toBe(false);
    expect(isValidToken("a".repeat(64) + "' or 1=1")).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
  });
});

describe("canCancel", () => {
  const now = new Date("2026-12-01T12:00:00Z");
  const future = "2026-12-02T12:00:00Z";
  const past = "2026-11-30T12:00:00Z";

  it("ativo e futuro pode cancelar", () => {
    expect(canCancel({ status: "pending", starts_at: future }, now)).toBe(true);
    expect(canCancel({ status: "confirmed", starts_at: future }, now)).toBe(true);
  });
  it("passado, cancelado ou concluído não pode", () => {
    expect(canCancel({ status: "confirmed", starts_at: past }, now)).toBe(false);
    expect(canCancel({ status: "cancelled", starts_at: future }, now)).toBe(false);
    expect(canCancel({ status: "completed", starts_at: future }, now)).toBe(false);
  });
});
