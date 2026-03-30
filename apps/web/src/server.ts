import handler from "@tanstack/react-start/server-entry";

import { paraglideMiddleware } from "@tsu-stack/i18n/server";
import { LOGGER_CATEGORIES_CLIENT, getLogger } from "@tsu-stack/logger/client";

const logger = getLogger(LOGGER_CATEGORIES_CLIENT.WEB_SERVER);

export default {
  async fetch(req: Request): Promise<Response> {
    const startTime = Date.now();
    logger.trace(`<-- ${req.method} ${req.url}`);
    const response = await paraglideMiddleware(req, () => handler.fetch(req));
    const duration = Date.now() - startTime;
    logger.trace(`--> ${req.method} ${req.url} ${response.status} in ${duration}ms`);
    return response;
  },
};
