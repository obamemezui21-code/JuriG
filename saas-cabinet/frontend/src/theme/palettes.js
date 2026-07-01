export const DEFAULT_THEME_KEY = "cabinet";

export const THEME_OPTIONS = [
  { key: "cabinet", label: "Institution", brand: "#17345f", strong: "#0d1f3f", soft: "#edf2fb", sideA: "#0c1525", sideB: "#16243d", sideC: "#22375d" },
  { key: "blue", label: "Bleu", brand: "#155eef", strong: "#0047cc", soft: "#e8efff", sideA: "#142850", sideB: "#1f3d7a", sideC: "#2250a5" },
  { key: "emerald", label: "Emeraude", brand: "#0f9f6e", strong: "#057a55", soft: "#e6fff5", sideA: "#0b3b2e", sideB: "#0d6a4d", sideC: "#14986a" },
  { key: "teal", label: "Teal", brand: "#0d9488", strong: "#0f766e", soft: "#e7fffd", sideA: "#073b40", sideB: "#0f5f67", sideC: "#13808b" },
  { key: "cyan", label: "Cyan", brand: "#0891b2", strong: "#0e7490", soft: "#e8fbff", sideA: "#063449", sideB: "#0c5770", sideC: "#1083a3" },
  { key: "sky", label: "Ciel", brand: "#0284c7", strong: "#0369a1", soft: "#e6f7ff", sideA: "#0b3150", sideB: "#114f7f", sideC: "#1871af" },
  { key: "indigo", label: "Indigo", brand: "#4f46e5", strong: "#4338ca", soft: "#edebff", sideA: "#1d2159", sideB: "#343d96", sideC: "#4d5ccf" },
  { key: "violet", label: "Violet", brand: "#7c3aed", strong: "#6d28d9", soft: "#f3ebff", sideA: "#2d1d58", sideB: "#4b2f8d", sideC: "#6c43c5" },
  { key: "magenta", label: "Magenta", brand: "#c026d3", strong: "#a21caf", soft: "#ffeafd", sideA: "#4d1f58", sideB: "#7d2f8e", sideC: "#b341c5" },
  { key: "rose", label: "Rose", brand: "#e11d48", strong: "#be123c", soft: "#ffeaf0", sideA: "#4f1f34", sideB: "#7d2f50", sideC: "#b13e67" },
  { key: "red", label: "Rouge", brand: "#dc2626", strong: "#b91c1c", soft: "#ffeded", sideA: "#4a1d1d", sideB: "#732d2d", sideC: "#a93e3e" },
  { key: "orange", label: "Orange", brand: "#ea580c", strong: "#c2410c", soft: "#fff1e7", sideA: "#4f2817", sideB: "#7e3f1f", sideC: "#b65924" },
  { key: "amber", label: "Ambre", brand: "#d97706", strong: "#b45309", soft: "#fff6e5", sideA: "#4a3118", sideB: "#755023", sideC: "#a96f2d" },
  { key: "yellow", label: "Jaune", brand: "#ca8a04", strong: "#a16207", soft: "#fff8d8", sideA: "#474017", sideB: "#6d6424", sideC: "#9a8a2f" },
  { key: "lime", label: "Lime", brand: "#65a30d", strong: "#4d7c0f", soft: "#f4ffe3", sideA: "#2e4218", sideB: "#4f6d24", sideC: "#719b2f" },
  { key: "green", label: "Vert", brand: "#16a34a", strong: "#15803d", soft: "#eafff0", sideA: "#1c3f2a", sideB: "#2f6944", sideC: "#3f9660" },
  { key: "slate", label: "Slate", brand: "#475569", strong: "#334155", soft: "#f0f3f8", sideA: "#1f2a3c", sideB: "#30435f", sideC: "#425d85" },
  { key: "graphite", label: "Graphite", brand: "#374151", strong: "#1f2937", soft: "#eef1f5", sideA: "#1a1f2b", sideB: "#2a3344", sideC: "#3b4a63" },
  { key: "chocolate", label: "Chocolat", brand: "#92400e", strong: "#78350f", soft: "#fff0e6", sideA: "#3c2618", sideB: "#5b3924", sideC: "#825034" },
];

const THEME_KEY_SET = new Set(THEME_OPTIONS.map((theme) => theme.key));

export const resolveThemeKey = (themeKey) => {
  const normalized = String(themeKey || "").trim();
  return THEME_KEY_SET.has(normalized) ? normalized : DEFAULT_THEME_KEY;
};
