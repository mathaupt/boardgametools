export interface PoolConfig {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

const POOL_CONFIG_PARAMS = ["connection_limit", "connect_timeout", "pool_timeout"];

function getDefaultPoolSize(): number {
  return process.env.VERCEL === "1" ? 1 : 10;
}

function getDefaultConnectionTimeoutMillis(): number {
  return 10_000;
}

export function parsePoolConfig(url: string): PoolConfig {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      connectionString: url,
      max: getDefaultPoolSize(),
      connectionTimeoutMillis: getDefaultConnectionTimeoutMillis(),
      idleTimeoutMillis: 20_000,
    };
  }

  const params = parsed.searchParams;
  let max = getDefaultPoolSize();
  const connectionLimit = params.get("connection_limit");
  if (connectionLimit) {
    const value = parseInt(connectionLimit, 10);
    if (!isNaN(value) && value > 0) max = value;
  }

  let connectionTimeoutMillis = getDefaultConnectionTimeoutMillis();
  const connectTimeout = params.get("connect_timeout");
  if (connectTimeout) {
    const value = parseInt(connectTimeout, 10);
    if (!isNaN(value) && value > 0) connectionTimeoutMillis = value * 1_000;
  }

  let idleTimeoutMillis = 20_000;
  const poolTimeout = params.get("pool_timeout");
  if (poolTimeout) {
    const value = parseInt(poolTimeout, 10);
    if (!isNaN(value) && value >= 0) idleTimeoutMillis = value * 1_000;
  }

  for (const key of POOL_CONFIG_PARAMS) params.delete(key);
  params.delete("pgbouncer");

  return { connectionString: parsed.toString(), max, connectionTimeoutMillis, idleTimeoutMillis };
}
