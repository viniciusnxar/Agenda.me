import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { safeNextPath } = await import("@/lib/auth");

describe("safeNextPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeNextPath("/dashboard/agenda?x=1")).toBe("/dashboard/agenda?x=1");
    expect(safeNextPath("/onboarding")).toBe("/onboarding");
  });

  it("recusa URLs externas e valores estranhos", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("dashboard")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined, "/x")).toBe("/x");
  });
});
