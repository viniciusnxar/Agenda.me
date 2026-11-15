import { describe, expect, it } from "vitest";

import { isPlatform, socialLabel, toSocialHref } from "@/lib/social";
import { getTheme, THEMES } from "@/lib/theme";

describe("toSocialHref", () => {
  it("@usuario vira link do perfil na rede", () => {
    expect(toSocialHref("instagram", "@dra.ana")).toBe("https://instagram.com/dra.ana");
    expect(toSocialHref("instagram", "draana")).toBe("https://instagram.com/draana");
    expect(toSocialHref("tiktok", "@ana")).toBe("https://tiktok.com/@ana");
    expect(toSocialHref("youtube", "@canal")).toBe("https://youtube.com/@canal");
  });

  it("mantém URLs completas e completa https em domínios", () => {
    expect(toSocialHref("instagram", "https://instagram.com/ana")).toBe("https://instagram.com/ana");
    expect(toSocialHref("site", "meusite.com.br")).toBe("https://meusite.com.br/");
    expect(toSocialHref("linkedin", "linkedin.com/in/ana")).toBe("https://linkedin.com/in/ana");
  });

  it("e-mail vira mailto e precisa ser válido", () => {
    expect(toSocialHref("email", "ana@clinica.com")).toBe("mailto:ana@clinica.com");
    expect(toSocialHref("email", "mailto:ana@clinica.com")).toBe("mailto:ana@clinica.com");
    expect(toSocialHref("email", "ana")).toBeNull();
  });

  it("bloqueia esquemas perigosos e valores vazios", () => {
    expect(toSocialHref("site", "javascript:alert(1)")).toBeNull();
    expect(toSocialHref("outro", "data:text/html,oi")).toBeNull();
    expect(toSocialHref("site", "   ")).toBeNull();
  });
});

describe("socialLabel e isPlatform", () => {
  it("usa o rótulo escolhido ou o nome da rede", () => {
    expect(socialLabel("instagram", "Meu Insta")).toBe("Meu Insta");
    expect(socialLabel("instagram", " ")).toBe("Instagram");
    expect(socialLabel("site", null)).toBe("Site");
  });
  it("isPlatform", () => {
    expect(isPlatform("tiktok")).toBe(true);
    expect(isPlatform("myspace")).toBe(false);
  });
});

describe("getTheme", () => {
  it("devolve o tema ou o padrão", () => {
    expect(getTheme("ocean")).toBe(THEMES.ocean);
    expect(getTheme("nao-existe")).toBe(THEMES.default);
    expect(getTheme(null)).toBe(THEMES.default);
    expect(getTheme("toString")).toBe(THEMES.default);
  });
});
