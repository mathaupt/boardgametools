import "@testing-library/jest-dom";

// Provide required env vars so that `src/lib/env.ts` (requireEnv) does not
// throw when modules are imported transitively during tests.
process.env.SQL_DATABASE_URL = process.env.SQL_DATABASE_URL || "postgres://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret-for-vitest";
