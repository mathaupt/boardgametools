const candidate = process.env.BGT_TEST_DATABASE_URL;
if (!candidate) {
  throw new Error("BGT_TEST_DATABASE_URL is required for integration tests.");
}

const databaseUrl = new URL(candidate);
const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
if (!new Set(["localhost", "127.0.0.1", "::1"]).has(databaseUrl.hostname)) {
  throw new Error("Integration tests require a local PostgreSQL host (localhost, 127.0.0.1, or ::1).");
}
if (!databaseName.startsWith("bgt_test_")) {
  throw new Error("Integration database name must begin with bgt_test_.");
}

process.env.SQL_DATABASE_URL = candidate;
process.env.NEXTAUTH_SECRET ??= "integration-test-secret-only";
