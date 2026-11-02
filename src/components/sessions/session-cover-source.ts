const LOCAL_UPLOAD_PATTERN = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function getSessionCoverSource(value: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;

  if (LOCAL_UPLOAD_PATTERN.test(source)) return source;
  if (source.startsWith("/")) return null;

  try {
    const parsed = new URL(source);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "cf.geekdo-images.com" ||
      parsed.port !== "" ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.hash !== ""
    ) {
      return null;
    }
    return source;
  } catch {
    return null;
  }
}
