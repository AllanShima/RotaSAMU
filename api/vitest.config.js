import { defineConfig } from "vitest/config";

import { getTestDatabaseUrl } from "./tests/support/test-database.js";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    globalSetup: ["./tests/support/global-setup.js"],
    // src/db/prisma.js reads DATABASE_URL when it is imported, so the test
    // database URL has to be in place before any application code loads.
    // Fixed so the CORS tests don't depend on .env.
    env: {
      DATABASE_URL: getTestDatabaseUrl(),
      CORS_ORIGIN: "http://localhost:3000",
    },
    // All files share one database, so they run one at a time.
    fileParallelism: false,
  },
});
