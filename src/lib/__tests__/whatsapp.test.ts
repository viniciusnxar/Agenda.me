import { describe, expect, it } from "vitest";

import { buildWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATE, fillTemplate, toWhatsAppNumber } from "@/lib/whatsapp";

describe("fillTemplate", () => {
  it("preenche o template padrão", () => {
    expect(
      fillTemplate(DEFAULT_WHATSAPP_TEMPLATE, { nome: "Maria", data: "01/12/2026", hora: "14:00", plano: "Unimed" }),
    ).toBe("Olá! Gostaria de agendar para 01/12/2026 às 14:00. Nome: Maria. Plano: Unimed.");
  });
  it("repete variáveis e deixa vazio o que falta", () => {
    expect(fillTemplate("{nome} {nome} [{plano}]", { nome: "Ana" })).toBe("Ana Ana []");
  });
  it("não mexe em chaves desconhecidas", () => {
    expect(fillTemplate("{outra} {nome}", { nome: "Ana" })).toBe("{outra} Ana");
  });
});

describe("toWhatsAppNumber", () => {
  it("adiciona 55 em número nacional", () => {
    expect(toWhatsAppNumber("(85) 99999-0000")).toBe("5585999990000");
    expect(toWhatsAppNumber("8533330000")).toBe("558533330000");
  });
  it("mantém número que já tem DDI", () => {
    expect(toWhatsAppNumber("+55 85 99999-0000")).toBe("5585999990000");
  });
});

describe("buildWhatsAppLink", () => {
  it("monta link com texto codificado", () => {
    expect(buildWhatsAppLink("85999990000", "Olá! Às 14h & tal")).toBe(
      "https://wa.me/5585999990000?text=Ol%C3%A1!%20%C3%80s%2014h%20%26%20tal",
    );
  });
  it("sem mensagem não tem ?text", () => {
    expect(buildWhatsAppLink("85999990000")).toBe("https://wa.me/5585999990000");
  });
});
