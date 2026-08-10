function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireOneOfEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing required environment variable: one of ${names.join(", ")}`);
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/** Returns undefined when env var is not set (unlike optionalEnv which always returns a string). */
function optionalEnvOrUndefined(name: string): string | undefined {
  return process.env[name] || undefined;
}

/**
 * Normalisiert Postgres-Verbindungsstrings, damit pg-connection-string
 * keine Warnung fuer aeltere SSL-Modi ausgibt. `prefer`, `require` und
 * `verify-ca` werden auf `verify-full` abgebildet, was dem aktuellen Verhalten
 * des Treibers entspricht.
 */
function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const sslmode = parsed.searchParams.get("sslmode");
    if (sslmode && ["prefer", "require", "verify-ca"].includes(sslmode)) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
  } catch {
    // Kein gueltiger URL-String; unveraendert weitergeben.
  }
  return url;
}

/**
 * Centralized environment configuration.
 * Uses getters so values are read lazily from process.env at access time,
 * which keeps things testable (vi.resetModules / process.env mutations).
 */
export const env = {
  // ── Required ──
  // Supports SQL_DATABASE_URL (project convention), DATABASE_URL (Vercel default), and the
  // native Vercel Postgres variables POSTGRES_URL (pooled) and POSTGRES_URL_NON_POOLING (direct).
  get DATABASE_URL() { return normalizeDatabaseUrl(requireOneOfEnv(["SQL_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"])); },
  get NEXTAUTH_SECRET() { return requireEnv("NEXTAUTH_SECRET"); },

  // ── App ──
  get NEXTAUTH_URL() { return optionalEnv("NEXTAUTH_URL", "http://localhost:3000"); },
  get NODE_ENV() { return optionalEnv("NODE_ENV", "development"); },
  get LOG_LEVEL() { return optionalEnv("LOG_LEVEL", "info"); },
  get NEXT_PUBLIC_APP_URL() { return optionalEnvOrUndefined("NEXT_PUBLIC_APP_URL"); },
  get VERCEL_URL() { return optionalEnvOrUndefined("VERCEL_URL"); },

  // ── BGG ──
  get BGG_API_URL() { return optionalEnv("BGG_API_URL", "https://boardgamegeek.com/xmlapi2"); },
  get BGG_AUTH_TOKEN() { return optionalEnvOrUndefined("BGG_AUTH_TOKEN"); },

  // ── SMTP ──
  get SMTP_HOST() { return optionalEnv("SMTP_HOST", "localhost"); },
  get SMTP_PORT() { return parseInt(optionalEnv("SMTP_PORT", "587"), 10); },
  get SMTP_SECURE() { return optionalEnv("SMTP_SECURE", "false"); },
  get SMTP_USER() { return optionalEnvOrUndefined("SMTP_USER"); },
  get SMTP_PASS() { return optionalEnvOrUndefined("SMTP_PASS"); },
  get SMTP_FROM() { return optionalEnvOrUndefined("SMTP_FROM"); },
  get PASSWORD_RESET_SENDER() { return optionalEnv("PASSWORD_RESET_SENDER", "BoardGameTools <no-reply@boardgametools.local>"); },
  get PASSWORD_RESET_TOKEN_TTL_MINUTES() { return optionalEnv("PASSWORD_RESET_TOKEN_TTL_MINUTES", "60"); },

  // ── Admin ──
  get ADMIN_EMAIL() { return optionalEnvOrUndefined("ADMIN_EMAIL"); },
  get ADMIN_PASSWORD() { return optionalEnvOrUndefined("ADMIN_PASSWORD"); },

  // ── Storage / Integrations ──
  get BLOB_READ_WRITE_TOKEN() { return optionalEnvOrUndefined("BLOB_READ_WRITE_TOKEN"); },
  get UPSTASH_REDIS_REST_URL() { return optionalEnvOrUndefined("UPSTASH_REDIS_REST_URL"); },
  get UPSTASH_REDIS_REST_TOKEN() { return optionalEnvOrUndefined("UPSTASH_REDIS_REST_TOKEN"); },

  // ── Apple Sign In ──
  get APPLE_CLIENT_ID() { return optionalEnvOrUndefined("APPLE_CLIENT_ID"); },

  // ── Apple Push Notifications (APNs) ──
  get APNS_ENABLED() { return optionalEnv("APNS_ENABLED", "false"); },
  get APNS_PRODUCTION() { return optionalEnv("APNS_PRODUCTION", "false"); },
  get APNS_TEAM_ID() { return optionalEnvOrUndefined("APNS_TEAM_ID"); },
  get APNS_KEY_ID() { return optionalEnvOrUndefined("APNS_KEY_ID"); },
  get APNS_SIGNING_KEY() { return optionalEnvOrUndefined("APNS_SIGNING_KEY"); },
  get APNS_TOPIC() { return optionalEnv("APNS_TOPIC", "com.boardgametools.ios"); },
};
