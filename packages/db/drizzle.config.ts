import { type Config } from "drizzle-kit";

import { ENV_SERVER } from "@tsu-stack/env/server/env";

export default {
  breakpoints: true,
  casing: "snake_case",
  dbCredentials: {
    url: ENV_SERVER.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema/index.ts",

  strict: true,
  verbose: true,
} satisfies Config;
