export const DEFAULT_ROLE_OPTIONS = [
  { value: "admin", label: "Administrateur" },
  { value: "member", label: "Collaborateur" },
];

export const ROLE_STORAGE_KEY = "customUserRoleCategories";

export const normalizeRoleValue = (value) => String(value || "").trim().toLowerCase();

export const buildRoleOption = (label, valueOverride) => {
  const trimmedLabel = String(label || "").trim();
  const rawValue = valueOverride !== undefined ? valueOverride : trimmedLabel;
  const normalizedValue = normalizeRoleValue(rawValue);

  if (!trimmedLabel || !normalizedValue) {
    return null;
  }

  return { value: normalizedValue, label: trimmedLabel };
};

export const loadCustomRoles = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return buildRoleOption(item);
        }
        if (item && typeof item === "object") {
          return buildRoleOption(item.label || item.value, item.value || item.label);
        }
        return null;
      })
      .filter(Boolean);
  } catch (_error) {
    return [];
  }
};

export const persistCustomRoles = (roles) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
};
