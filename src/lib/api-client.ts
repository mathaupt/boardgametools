/**
 * Centralized API client with error handling and typed responses.
 */

export class FetchError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "FetchError";
  }
}

/** Default fetcher for SWR — throws FetchError on non-OK responses */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new FetchError(res.status, body.error || res.statusText, body);
  }
  return res.json();
}

/** POST/PUT/DELETE helper with JSON body */
export async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: options.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new FetchError(res.status, body.error || res.statusText, body);
  }
  return res.json();
}
