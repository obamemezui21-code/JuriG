export const parsePricedElements = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = line.replace(/^[-*]\s*/, "");
      const stored = normalized.match(/^(.*)::([0-9]+(?:[.,][0-9]+)?)$/);
      if (stored) {
        return {
          label: stored[1].trim(),
          amount: Number(stored[2].replace(",", ".")),
        };
      }

      const trailing = normalized.match(/^(.*?)(?:\s*[:|-]\s*|\s+)([0-9]+(?:[.,][0-9]+)?)\s*(XAF|FCFA|EUR|USD)$/i);
      if (trailing) {
        return {
          label: trailing[1].trim(),
          amount: Number(trailing[2].replace(",", ".")),
        };
      }

      return { label: normalized.trim(), amount: null };
    })
    .filter((entry) => entry.label)
    .filter((entry, index, array) => array.findIndex((it) => it.label === entry.label) === index);