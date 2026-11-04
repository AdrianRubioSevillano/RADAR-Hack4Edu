// Identidad visual de cada competencia. El color nunca va solo: siempre lo
// acompañan un símbolo y el nombre. Paleta comprobada con el validador de dataviz.
export interface SkillTheme {
  readonly color: string;
  readonly glyph: string;
}

const THEMES: Readonly<Record<string, SkillTheme | undefined>> = {
  OPS: { color: "#0F7FE0", glyph: "+" },
  NEG: { color: "#EE6A3C", glyph: "−3" },
  FRA: { color: "#0FA58A", glyph: "½" },
  JER: { color: "#8A5CE6", glyph: "( )" },
  ALG: { color: "#E0A100", glyph: "x" },
  ECU: { color: "#D6409F", glyph: "=" },
};

export function skillTheme(id: string): SkillTheme {
  return THEMES[id] ?? { color: "#0F7FE0", glyph: "?" };
}

// Colores de los dos planes: forma y etiqueta los distinguen también sin color.
export const PLAN_THEME = {
  collective: { color: "#0068C8", mark: "A" },
  pendingNeed: { color: "#EE6A3C", mark: "B" },
} as const;
