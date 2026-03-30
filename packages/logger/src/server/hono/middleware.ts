import { type Logger } from "@logtape/logtape";
import { type MiddlewareHandler } from "hono";
import { type GetConnInfo } from "hono/conninfo";
import { createMiddleware } from "hono/factory";
import { requestId } from "hono/request-id";
import { routePath } from "hono/route";

import { getRealIpFromHeaders, normalizeIp } from "#@/utils/index";

// #region Types

// Dependency injection for Hono context to provide a logger with request-specific context (e.g. request ID, IP address, user agent)
// We need to use the same `tsconfig.json` as the server to ensure the types are compatible
// so we put make a nested tsconfig in `src/server/hono` that extends the same config as the server
type HonoLoggerMiddlewareVariables = {
  logger: Logger;
};

declare module "hono" {
  // @ts-expect-error - module augmentation to add logger to Hono context variables
  type ContextVariableMap = {} & HonoLoggerMiddlewareVariables;
}

// #region Implementation
/**
 * Hono middleware that adds request logging and injects a logger instance into the context.
 *
 * The middleware:
 * - Adds a unique request ID to each request for correlation
 * - Logs incoming requests and outgoing responses with duration
 * - Injects a logger with request context (IP, user agent, method, path) into `c.var.logger`
 * - Automatically adds the request ID to the logger context
 *
 * @example
 * ```typescript
 * import { honoLoggerMiddleware } from "@tsu-stack/logger/server/hono/middleware";
 * import { getConnInfo } from "@hono/node-server/conninfo";
 *
 * app.use(honoLoggerMiddleware({
 *   getConnInfoFn: getConnInfo,
 *   excludePaths: ["/health", "/metrics"]
 * }));
 *
 * app.get("/api/users", (c) => {
 *   c.var.logger.info("Fetching users");
 *   return c.json({ users: [] });
 * });
 * ```
 *
 * @param options - Configuration options for the middleware
 * @param options.logger - An instance of a Logger to use for logging requests
 * @param options.getConnInfoFn - Function to extract connection info from the Hono context. Import the appropriate variant for your platform from Hono (e.g., `@hono/node-server/conninfo`). See https://hono.dev/docs/helpers/conninfo#conninfo-helper
 * @param options.excludePaths - Optional array of paths to skip logging for (e.g., `/health` or `/metrics` endpoints)
 * @param options.excludeIps - Optional array of IPs to skip logging for (e.g., internal services or health checks)
 * @param options.context - Optional additional context to include in the logger (e.g., application name or version)
 * @returns Hono middleware handler
 */
export function honoLoggerMiddlewareChain(options: {
  logger: Logger;
  getConnInfoFn: GetConnInfo;
  excludePaths?: string[];
  excludeIps?: string[];
  context?: Record<string, unknown>;
}): MiddlewareHandler[] {
  // Inject a unique request ID for each request to correlate logs across the request lifecycle
  const requestIdMiddleware = requestId();

  // Pre-compute normalized IPs for O(1) lookup performance
  const excludedIpsSet = new Set(options.excludeIps?.map((ip) => normalizeIp(ip)) ?? []);

  // Create a logger middleware that logs incoming requests and outgoing responses with duration, and injects a logger instance into the context
  const loggerMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();

    // Get connection info (e.g. IP address) for logging context
    const connInfo = options.getConnInfoFn(c);
    const realIp = getRealIp(c, connInfo);

    // Convert query params to plain object for logging
    const query = c.req.query();

    const { logger } = options;
    const loggerWithContext = logger.with({
      requestId: c.var.requestId,
      ...options.context,
      ip: realIp,
      userAgent: c.req.header("user-agent"),
      referer: c.req.header("referer"),
      cookies: c.req.header("cookie"),
      method: c.req.method,
      path: c.req.path,
      routePath: routePath(c), // the registered route pattern of the current handler (e.g. /api/users/:id) instead of the actual path (e.g. /api/users/123) for better log aggregation
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    c.set("logger", loggerWithContext);

    if (options.excludePaths?.includes(c.req.path) || excludedIpsSet.has(normalizeIp(realIp))) {
      // Exit early if the request path or IP is in the skip list
      // so we that we don't log diagnostics unless manually called for via c.var.logger
      return next();
    }

    c.var.logger.trace(`--> ${c.req.method} ${c.req.path}`);

    await next();

    const durationMs = Date.now() - start;
    const { status } = c.res;

    c.var.logger
      .with({ status })
      .trace(`<-- ${c.req.method} ${c.req.path} ${status} in ${durationMs}ms`);
  });

  return [requestIdMiddleware, loggerMiddleware];
}

// #region Helpers

/**
 * Get real client IP from Hono context, checking proxy headers and falling back to direct connection.
 * Priority order: most specific/trustworthy first, then fallback to direct connection.
 */
function getRealIp(
  c: Parameters<Parameters<typeof createMiddleware>[0]>[0],
  connInfo: ReturnType<GetConnInfo>,
) {
  // Convert Hono headers to standard Headers object for reusable utility
  const headers = new Headers();
  c.req.raw.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return getRealIpFromHeaders(headers) ?? connInfo.remote.address;
}
