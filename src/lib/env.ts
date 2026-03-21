function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const env = {
  DATABASE_URL: requireEnv("SQL_DATABASE_URL"),
  NEXTAUTH_URL: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET"),
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  LOG_LEVEL: optionalEnv("LOG_LEVEL", "info"),
  BGG_API_URL: optionalEnv("BGG_API_URL", "https://boardgamegeek.com/xmlapi2"),
  SMTP_HOST: optionalEnv("SMTP_HOST", "localhost"),
  SMTP_PORT: optionalEnv("SMTP_PORT", "2525"),
  SMTP_SECURE: optionalEnv("SMTP_SECURE", "false"),
  PASSWORD_RESET_SENDER: optionalEnv("PASSWORD_RESET_SENDER", "BoardGameTools <no-reply@boardgametools.local>"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: optionalEnv("PASSWORD_RESET_TOKEN_TTL_MINUTES", "60"),
} as const;
