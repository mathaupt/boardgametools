/**
 * Shared test helpers for API route integration tests.
 */

export function createMockRequest(
  method: string,
  url: string = "http://localhost:3000/api/test",
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
): Request {
  const urlObj = new URL(url);
  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      urlObj.searchParams.set(key, value);
    }
  }

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...options?.headers,
    },
  };

  if (options?.body && method !== "GET") {
    init.body = JSON.stringify(options.body);
  }

  return new Request(urlObj.toString(), init);
}

export function createRouteContext(
  params: Record<string, string>
): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve(params) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseResponse(response: any): { status: number; body: any } {
  return { status: response.status, body: response.body };
}
