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

export function firstError(...errors: (string | null)[]): string | null {
  return errors.find((e) => e !== null) ?? null;
}
