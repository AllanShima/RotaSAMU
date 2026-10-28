import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const getTestDatabaseUrl = () => {
  if (process.env.TEST_DATABASE_URL) {
    return assertTestDatabase(process.env.TEST_DATABASE_URL);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Set DATABASE_URL (or TEST_DATABASE_URL) to run the tests. " +
        "Inside Docker, use: docker compose exec api npm test",
    );
  }

  const url = new URL(process.env.DATABASE_URL);
  if (!url.pathname.endsWith("_test")) url.pathname = `${url.pathname}_test`;

  return assertTestDatabase(url.toString());
};

export const assertTestDatabase = (connectionString) => {
  const name = databaseName(connectionString);

  if (!/^[\w-]+_test$/.test(name)) {
    throw new Error(
      `Refusing to run tests against "${name}": the database name must end with "_test"`,
    );
  }

  return connectionString;
};

export const createTestDatabaseIfMissing = async () => {
  const testUrl = getTestDatabaseUrl();
  const name = databaseName(testUrl);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
};

export const migrateTestDatabase = () => {
  execSync("npx prisma migrate deploy", {
    cwd: API_ROOT,
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: getTestDatabaseUrl() },
  });
};

// Private

const databaseName = (connectionString) =>
  new URL(connectionString).pathname.slice(1);
