import { describe, expect, it } from "vitest";

import {
  formatCpf,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatPhone,
  formatTime,
  maskCpf,
  onlyDigits,
} from "@/lib/format";

describe("onlyDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyDigits("(85) 99999-0000")).toBe("85999990000");
  });
});

describe("formatCpf", () => {
  it("formata CPF completo", () => {
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });
  it("formata enquanto digita", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("1234")).toBe("123.4");
    expect(formatCpf("1234567")).toBe("123.456.7");
    expect(formatCpf("1234567890")).toBe("123.456.789-0");
  });
  it("ignora excesso e caracteres", () => {
    expect(formatCpf("123.456.789-0999")).toBe("123.456.789-09");
  });
});

describe("maskCpf", () => {
  it("esconde início e dígitos verificadores", () => {
    expect(maskCpf("123.456.789-09")).toBe("***.456.789-**");
  });
  it("não vaza CPF inválido", () => {
    expect(maskCpf("123")).toBe("***.***.***-**");
  });
});

describe("formatPhone", () => {
  it("celular com 11 dígitos", () => {
    expect(formatPhone("85999990000")).toBe("(85) 99999-0000");
  });
  it("fixo com 10 dígitos", () => {
    expect(formatPhone("8533330000")).toBe("(85) 3333-0000");
  });
  it("remove o 55", () => {
    expect(formatPhone("5585999990000")).toBe("(85) 99999-0000");
  });
  it("formata enquanto digita", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("8")).toBe("(8");
    expect(formatPhone("859")).toBe("(85) 9");
    expect(formatPhone("8599999")).toBe("(85) 9999-9");
  });
});

describe("datas pt-BR no fuso do profissional", () => {
  // 00:30 UTC do dia 2 ainda é dia 1 em Fortaleza (UTC-3)
  const instant = "2026-12-02T00:30:00Z";
  const tz = "America/Fortaleza";

  it("formatDate", () => {
    expect(formatDate(instant, tz)).toBe("01/12/2026");
    expect(formatDate(instant, "UTC")).toBe("02/12/2026");
  });
  it("formatTime em 24h", () => {
    expect(formatTime(instant, tz)).toBe("21:30");
    expect(formatTime("2026-12-01T03:05:00Z", tz)).toBe("00:05");
  });
  it("formatDateLong", () => {
    expect(formatDateLong(instant, tz)).toBe("terça-feira, 1 de dezembro de 2026");
  });
  it("formatDateTime", () => {
    expect(formatDateTime(new Date(instant), tz)).toBe("01/12/2026 às 21:30");
  });
});
