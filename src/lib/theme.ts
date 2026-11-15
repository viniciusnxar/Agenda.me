// Temas da página pública. As classes ficam escritas por inteiro para o Tailwind encontrá-las.

export type Theme = {
  label: string;
  /** fundo da página */
  page: string;
  /** cards de redes sociais */
  card: string;
  /** botão principal (Agendar) */
  button: string;
  /** texto secundário */
  muted: string;
  /** cores da imagem OG (hex) */
  og: { background: string; foreground: string; accent: string };
};

export const THEMES = {
  default: {
    label: "Claro",
    page: "bg-neutral-50 text-neutral-900",
    card: "bg-white border-neutral-200 hover:bg-neutral-100",
    button: "bg-neutral-900 text-white hover:bg-neutral-800",
    muted: "text-neutral-500",
    og: { background: "#fafafa", foreground: "#171717", accent: "#171717" },
  },
  ocean: {
    label: "Oceano",
    page: "bg-sky-50 text-sky-950",
    card: "bg-white border-sky-200 hover:bg-sky-100",
    button: "bg-sky-700 text-white hover:bg-sky-800",
    muted: "text-sky-800/70",
    og: { background: "#f0f9ff", foreground: "#082f49", accent: "#0369a1" },
  },
  forest: {
    label: "Floresta",
    page: "bg-emerald-50 text-emerald-950",
    card: "bg-white border-emerald-200 hover:bg-emerald-100",
    button: "bg-emerald-700 text-white hover:bg-emerald-800",
    muted: "text-emerald-800/70",
    og: { background: "#ecfdf5", foreground: "#022c22", accent: "#047857" },
  },
  sunset: {
    label: "Pôr do sol",
    page: "bg-rose-50 text-rose-950",
    card: "bg-white border-rose-200 hover:bg-rose-100",
    button: "bg-rose-600 text-white hover:bg-rose-700",
    muted: "text-rose-800/70",
    og: { background: "#fff1f2", foreground: "#4c0519", accent: "#e11d48" },
  },
  lavender: {
    label: "Lavanda",
    page: "bg-violet-50 text-violet-950",
    card: "bg-white border-violet-200 hover:bg-violet-100",
    button: "bg-violet-700 text-white hover:bg-violet-800",
    muted: "text-violet-800/70",
    og: { background: "#f5f3ff", foreground: "#2e1065", accent: "#6d28d9" },
  },
  dark: {
    label: "Escuro",
    page: "bg-neutral-950 text-neutral-50",
    card: "bg-neutral-900 border-neutral-800 hover:bg-neutral-800",
    button: "bg-white text-neutral-900 hover:bg-neutral-200",
    muted: "text-neutral-400",
    og: { background: "#0a0a0a", foreground: "#fafafa", accent: "#fafafa" },
  },
} satisfies Record<string, Theme>;

export type ThemeKey = keyof typeof THEMES;

export function isThemeKey(value: string): value is ThemeKey {
  return Object.hasOwn(THEMES, value);
}

export function getTheme(key: string | null | undefined): Theme {
  return key && isThemeKey(key) ? THEMES[key] : THEMES.default;
}
