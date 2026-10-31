/** A message field is an error contract only when its response has an error status. */
export function isLegacyMessageErrorResponse(line) {
  return /message\s*:[^\n]*status\s*:\s*[45]\d\d/.test(line);
}
