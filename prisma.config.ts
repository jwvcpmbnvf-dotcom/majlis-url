import { config as loadEnv } from "dotenv";
// Local override files, then the shared one. dotenv never overrides already-set values.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use a fallback so `prisma generate` still works when DATABASE_URL is
    // not set (e.g. CI during type-checking).
    url: process.env["DATABASE_URL"] ?? "",
  },
});