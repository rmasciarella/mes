import { type Logger } from "@logtape/logtape";
import { createMiddleware } from "@tanstack/react-start";

import { getRealIpFromHeaders, normalizeIp } from "#@/utils/index"; // for consistency with hono midleware import

// #region Types

type RequestIdOptions = {
  limitLength?: number;
  headerName?: string;
  generator?: () => string;
};

// #region Helper Middleware

const INVALID_REQUEST_ID_CHARS_REGEX = /[^\w\-=]/;

/**
 * Middleware that generates and injects a unique request ID.
 * Similar to Hono's requestId middleware.
 */
function injectRequestIdMiddleware(options: RequestIdOptions = {}) {
  const {
    limitLength = 255,
    headerName = "X-Request-Id",
    generator = () => crypto.randomUUID(),
  } = options;

  return createMiddleware().server(({ next, request }) => {
    let reqId = headerName ? request.headers.get(headerName) : undefined;

    if (!reqId || reqId.length > limitLength || INVALID_REQUEST_ID_CHARS_REGEX.test(reqId)) {
      reqId = generator();
    }

    return next({
      context: {
        requestId: reqId,
      },
    });
  });
}

const injectRequestMiddleware = createMiddleware().server(({ next, request }) => {
  const url = new URL(request.url);
  const realIp = getRealIpFromHeaders(request.headers);

  // Convert URLSearchParams to plain object for logging
  const query = Object.fromEntries(url.searchParams.entries());

  return next({
    context: {
      request: {
        cookies: request.headers.get("cookie") ?? undefined,
        hostname: url.hostname,
        ip: normalizeIp(realIp),
        method: request.method,
        path: url.pathname,
        query: Object.keys(query).length > 0 ? query : undefined,
        referer: request.headers.get("referer") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    },
  });
});

// #region Shared Helpers

/**
 * Creates a function to check if a request should skip logging
 */
function createSkipChecker(options: { excludePaths?: string[]; excludeIps?: string[] }) {
  const excludedIpsSet = new Set(options.excludeIps?.map((ip) => normalizeIp(ip)) ?? []);
  const excludedPaths = options.excludePaths ?? [];

  return (context: { request: { path: string; ip?: string } }) =>
    excludedPaths.includes(context.request.path) || excludedIpsSet.has(context.request.ip ?? "");
}

/**
 * Wraps request execution with timing and logging
 */
async function withRequestLogging<T>(options: {
  logger: Logger;
  context: { request: { method: string; path: string } };
  shouldSkip: boolean;
  execute: () => Promise<T>;
}): Promise<T> {
  const { logger, context, shouldSkip, execute } = options;

  if (!shouldSkip) {
    logger.trace(`--> ${context.request.method} ${context.request.path} {*}`);
  }

  const start = Date.now();
  const result = await execute();
  const durationMs = Date.now() - start;

  if (!shouldSkip) {
    logger.trace(`<-- ${context.request.method} ${context.request.path} in ${durationMs}ms {*}`);
  }

  return result;
}

// #region Exported Middleware

export function tanstackStartServerFnLoggerMiddleware(options: {
  logger: Logger;
  context?: Record<string, unknown>;
  requestIdOptions?: RequestIdOptions;
  excludeIps?: string[];
}) {
  const requestIdMiddleware = injectRequestIdMiddleware(options.requestIdOptions);

  const shouldSkip = createSkipChecker({ excludeIps: options.excludeIps });

  return createMiddleware({ type: "function" })
    .middleware([requestIdMiddleware, injectRequestMiddleware])
    .server(({ next, context }) => {
      const loggerWithContext = options.logger.with({
        requestId: context.requestId,
        ...context.request,
        ...options.context,
      });

      return withRequestLogging({
        context,
        execute: async () =>
          next({
            context: {
              logger: loggerWithContext,
            },
          }),
        logger: loggerWithContext,
        shouldSkip: shouldSkip(context),
      });
    });
}

export function tanstackStartRequestLoggerMiddleware(options: {
  logger: Logger;
  context?: Record<string, unknown>;
  requestIdOptions?: RequestIdOptions;
  excludePaths?: string[];
  excludeIps?: string[];
}) {
  const requestIdMiddleware = injectRequestIdMiddleware(options.requestIdOptions);

  const shouldSkip = createSkipChecker({
    excludeIps: options.excludeIps,
    excludePaths: options.excludePaths,
  });

  return createMiddleware({ type: "request" })
    .middleware([requestIdMiddleware, injectRequestMiddleware])
    .server(({ next, context }) => {
      const loggerWithContext = options.logger.with({
        requestId: context.requestId,
        ...context.request,
        ...options.context,
      });

      return withRequestLogging({
        context,
        execute: async () =>
          next({
            context: {
              logger: loggerWithContext,
            },
          }),
        logger: loggerWithContext,
        shouldSkip: shouldSkip(context),
      });
    });
}

declare module "@tanstack/react-start" {
  // @ts-expect-error - module augmentation to add our custom RouterAppContext to Tanstack Router's createRouter generic
  type Register = {
    functionMiddleware: readonly [ReturnType<typeof tanstackStartServerFnLoggerMiddleware>];
    requestMiddleware: readonly [ReturnType<typeof tanstackStartRequestLoggerMiddleware>];
  };
}
