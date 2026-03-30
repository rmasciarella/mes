import { createStart } from "@tanstack/react-start";

import { LOGGER_CATEGORIES_CLIENT, getLogger } from "@tsu-stack/logger/client";
import {
  tanstackStartRequestLoggerMiddleware,
  tanstackStartServerFnLoggerMiddleware,
} from "@tsu-stack/logger/server/tanstack-start/middleware";

// We load it in vite.config.ts because they are originally from ENV_WEB_SERVER variables
declare const __BUILD_SOURCE_COMMIT__: string;
declare const __BUILD_NODE_ENV__: string;

export const startInstance = createStart(() => {
  return {
    // for Server Functions
    functionMiddleware: [
      tanstackStartServerFnLoggerMiddleware({
        context: {
          environment: __BUILD_NODE_ENV__,
          version: __BUILD_SOURCE_COMMIT__,
        },
        logger: getLogger(LOGGER_CATEGORIES_CLIENT.WEB_SERVER_FN),
      }),
    ],
    // for API routes
    requestMiddleware: [
      tanstackStartRequestLoggerMiddleware({
        context: {
          environment: __BUILD_NODE_ENV__,
          version: __BUILD_SOURCE_COMMIT__,
        },
        logger: getLogger(LOGGER_CATEGORIES_CLIENT.WEB_SERVER_API),
      }),
    ],
  };
});
