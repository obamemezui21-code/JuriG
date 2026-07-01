const THEME_KEYS = [
  "blue",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "indigo",
  "violet",
  "magenta",
  "rose",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "slate",
  "graphite",
  "chocolate",
];

const DEFAULT_THEME_KEY = "blue";

const isValidThemeKey = (themeKey) => THEME_KEYS.includes(String(themeKey || "").trim());

module.exports = {
  THEME_KEYS,
  DEFAULT_THEME_KEY,
  isValidThemeKey,
};
