import { env } from "@/lib/env";

const BGG_API_URL = "https://boardgamegeek.com/xmlapi2";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEADLINE_MS = 10_000;

export class BggTransportError extends Error {
  constructor(public readonly status: 404 | 502 | 503 | 504, message: string) {
    super(message);
    this.name = "BggTransportError";
  }
}

async function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    const abort = () => {
      clearTimeout(timeout);
      reject(signal.reason ?? new Error("BGG request aborted"));
    };
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

async function readLimitedBody(response: Response): Promise<string> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
    throw new BggTransportError(502, "Die Antwort von BoardGameGeek ist zu groß.");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new BggTransportError(502, "Die Antwort von BoardGameGeek ist zu groß.");
    }
    chunks.push(value);
  }
  const content = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(content);
}

export async function fetchBggXml(path: string, signal?: AbortSignal): Promise<string> {
  const deadline = AbortSignal.timeout(DEADLINE_MS);
  const requestSignal = signal ? AbortSignal.any([deadline, signal]) : deadline;
  const headers: Record<string, string> = {
    Accept: "application/xml",
    "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
  };
  if (env.BGG_AUTH_TOKEN) headers.Authorization = `Bearer ${env.BGG_AUTH_TOKEN}`;
  const url = `${BGG_API_URL}/${path}`;

  try {
    for (let attempt = 0; attempt <= 2; attempt += 1) {
      const response = await fetch(url, { headers, signal: requestSignal, cache: "no-store" });
      if (response.status === 202) {
        if (attempt === 2) throw new BggTransportError(503, "BoardGameGeek verarbeitet die Anfrage noch.");
        await wait(250 * (attempt + 1), requestSignal);
        continue;
      }
      if (response.status === 404) throw new BggTransportError(404, "Spiel auf BoardGameGeek nicht gefunden.");
      if (response.status === 429 || response.status >= 500) {
        throw new BggTransportError(503, "BoardGameGeek ist vorübergehend nicht verfügbar.");
      }
      if (!response.ok) throw new BggTransportError(502, "BoardGameGeek hat eine ungültige Antwort geliefert.");
      return await readLimitedBody(response);
    }
    throw new BggTransportError(503, "BoardGameGeek verarbeitet die Anfrage noch.");
  } catch (error) {
    if (error instanceof BggTransportError) throw error;
    if (requestSignal.aborted && deadline.aborted) {
      throw new BggTransportError(504, "Die Anfrage an BoardGameGeek hat zu lange gedauert.");
    }
    if (signal?.aborted) throw error;
    throw new BggTransportError(503, "BoardGameGeek ist vorübergehend nicht erreichbar.");
  }
}
