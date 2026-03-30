import { configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { defu } from "defu";

type LoggerConfig = Parameters<typeof configure>[0];

// Categories should be short, lowercase identifiers (e.g., "http", "db", "auth")
// They can be hierarchical using arrays (e.g., ["db", "query"], ["auth", "login"])
export const LOGGER_CATEGORIES_SERVER = Object.freeze({
  LOGTAPE_META: ["logtape", "meta"],
  CATCH_ALL: [], // catch-all category for uncategorized logs
  SERVER: ["server"],
  SERVER_DB: ["server", "db"],
});

export const LOGGER_SINKS_SERVER = Object.freeze({
  CONSOLE: "console",
});

const DEFAULT_CONFIG: LoggerConfig = {
  loggers: [
    {
      category: LOGGER_CATEGORIES_SERVER.CATCH_ALL,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_SERVER.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_SERVER.LOGTAPE_META,
      lowestLevel: "warning", // to silence warning: https://logtape.org/manual/categories#meta-logger
      sinks: [LOGGER_SINKS_SERVER.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_SERVER.SERVER,
      lowestLevel: "trace",
      sinks: [LOGGER_SINKS_SERVER.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_SERVER.SERVER_DB,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_SERVER.CONSOLE],
    },
  ],
  reset: true,
  sinks: {
    [LOGGER_SINKS_SERVER.CONSOLE]: getConsoleSink(),
  },
};

let isConfigured = false;

/**
 * Configure the logger with default or custom settings.
 * This should be called once at application startup.
 *
 * Default configuration includes:
 * - `["logtape", "meta"]` at `warning` level (LogTape internal logs)
 * - `server` at `trace` level (server lifecycle)
 *
 * @param userConfig - Partial logger configuration to merge with defaults
 *
 * @example
 * ```typescript
 * // Use defaults
 * await configureLogger();
 *
 * // Add custom categories (merges with defaults)
 * await configureLogger({
 *   loggers: [
 *     { category: "db", lowestLevel: "debug", sinks: ["console"] },
 *     { category: "rpc", lowestLevel: "trace", sinks: ["console"] },
 *   ]
 * });
 * ```
 */
export async function configureLogger(userConfig: Partial<LoggerConfig> = {}) {
  if (isConfigured) {
    return;
  }

  const mergedConfig = defu(userConfig, DEFAULT_CONFIG) as LoggerConfig;

  await configure(mergedConfig);

  isConfigured = true;
}

export { getLogger };
