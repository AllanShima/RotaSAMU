import {
  createTestDatabaseIfMissing,
  migrateTestDatabase,
} from "./test-database.js";

// Roda uma vez antes de todos os testes: garante que o banco "*_test" exista
// e esteja com as migrações aplicadas. Nunca toca no banco de desenvolvimento
// (getTestDatabaseUrl recusa nomes que não terminam em "_test").
export default async function setup() {
  await createTestDatabaseIfMissing();
  migrateTestDatabase();
}
