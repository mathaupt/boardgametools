export function validateString(
  value: unknown,
  field: string,
  opts: { required?: boolean; min?: number; max?: number } = {}
): string | null {
  const { required = true, min, max = 500 } = opts;
  if (!value && required) return `${field} ist erforderlich`;
  if (value && typeof value !== "string") return `${field} muss ein Text sein`;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (min !== undefined && trimmed.length < min) return `${field} muss mindestens ${min} Zeichen lang sein`;
    if (trimmed.length > max) return `${field} darf maximal ${max} Zeichen lang sein`;
  }
  return null;
}

export function validateNumber(
  value: unknown,
  field: string,
  opts: { required?: boolean; min?: number; max?: number } = {}
): string | null {
  const { required = true, min, max } = opts;
  if (value === undefined || value === null || value === "") return required ? `${field} ist erforderlich` : null;
  const num = Number(value);
  if (isNaN(num)) return `${field} muss eine Zahl sein`;
  if (min !== undefined && num < min) return `${field} muss mindestens ${min} sein`;
  if (max !== undefined && num > max) return `${field} darf maximal ${max} sein`;
  return null;
}

export function validateEmail(
  value: unknown,
  field: string = "E-Mail",
  opts: { required?: boolean } = {}
): string | null {
  const { required = true } = opts;
  if (!value) return required ? `${field} ist erforderlich` : null;
  if (typeof value !== "string") return `${field} muss ein Text sein`;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed && required) return `${field} ist erforderlich`;
  if (!trimmed) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return `${field} ist keine gültige E-Mail-Adresse`;
  if (trimmed.length > 254) return `${field} ist zu lang`;
  return null;
}

export function validateUrl(
  value: unknown,
  field: string = "URL",
  opts: { required?: boolean; protocols?: string[] } = {}
): string | null {
  const { required = true, protocols = ["http:", "https:"] } = opts;
  if (!value) return required ? `${field} ist erforderlich` : null;
  if (typeof value !== "string") return `${field} muss ein Text sein`;
  const trimmed = value.trim();
  if (!trimmed && required) return `${field} ist erforderlich`;
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (protocols.length > 0 && !protocols.includes(url.protocol)) {
      return `${field} muss mit ${protocols.join(" oder ")} beginnen`;
    }
  } catch {
    return `${field} ist keine gültige URL`;
  }
  return null;
}

export function validateDate(
  value: unknown,
  field: string = "Datum",
  opts: { required?: boolean; min?: Date; max?: Date } = {}
): string | null {
  const { required = true, min, max } = opts;
  if (!value) return required ? `${field} ist erforderlich` : null;
  if (typeof value !== "string" && !(value instanceof Date)) return `${field} muss ein Datum sein`;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return `${field} ist kein gültiges Datum`;
  if (min && date < min) return `${field} darf nicht vor ${min.toLocaleDateString("de-DE")} liegen`;
  if (max && date > max) return `${field} darf nicht nach ${max.toLocaleDateString("de-DE")} liegen`;
  return null;
}

export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  opts: { required?: boolean } = {}
): string | null {
  const { required = true } = opts;
  if (!value) return required ? `${field} ist erforderlich` : null;
  if (typeof value !== "string") return `${field} muss ein Text sein`;
  if (!allowed.includes(value as T)) return `${field} muss einer der folgenden Werte sein: ${allowed.join(", ")}`;
  return null;
}

export function firstError(...errors: (string | null)[]): string | null {
  return errors.find((e) => e !== null) ?? null;
}
