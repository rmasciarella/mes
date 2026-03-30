import { type configure } from "@logtape/logtape";
import { configureSync, getConsoleSink, getLogger } from "@logtape/logtape";
import { defu } from "defu";

type LoggerConfig = Parameters<typeof configure>[0];

// Categories should be short, lowercase identifiers (e.g., "http", "db", "auth")
// They can be hierarchical using arrays (e.g., ["db", "query"], ["auth", "login"])
export const LOGGER_CATEGORIES_CLIENT = Object.freeze({
  LOGTAPE_META: ["logtape", "meta"],
  CATCH_ALL: [], // catch-all category for uncategorized logs
  WEB: ["web"],
  WEB_BUILD: ["web", "build"],
  WEB_CLIENT: ["web", "client"],
  WEB_SERVER: ["web", "server"],
  WEB_SERVER_API: ["web", "server", "api"],
  WEB_SERVER_FN: ["web", "server", "functions"],
});

export const LOGGER_SINKS_CLIENT = Object.freeze({
  CONSOLE: "console",
});

const DEFAULT_CONFIG: LoggerConfig = {
  loggers: [
    {
      category: LOGGER_CATEGORIES_CLIENT.LOGTAPE_META,
      lowestLevel: "warning", // to silence warning: https://logtape.org/manual/categories#meta-logger
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.CATCH_ALL,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB_BUILD,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB_CLIENT,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB_SERVER,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB_SERVER_API,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
    {
      category: LOGGER_CATEGORIES_CLIENT.WEB_SERVER_FN,
      lowestLevel: "debug",
      sinks: [LOGGER_SINKS_CLIENT.CONSOLE],
    },
  ],
  reset: true,
  sinks: {
    [LOGGER_SINKS_CLIENT.CONSOLE]: getConsoleSink(),
  },
};

let isConfigured = false;

/**
 * Use this in your App entry point or root layout
 *
 * @param userConfig
 */
export function configureLoggerSync(userConfig: Partial<LoggerConfig> = {}) {
  if (isConfigured) {
    return;
  }

  const mergedConfig = defu(userConfig, DEFAULT_CONFIG) as LoggerConfig;

  configureSync(mergedConfig);

  isConfigured = true;
}

export { getLogger };
