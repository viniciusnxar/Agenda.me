import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // áreas logadas e páginas privadas do paciente não devem ser indexadas
      disallow: ["/dashboard", "/onboarding", "/auth/", "/c/"],
    },
  };
}
