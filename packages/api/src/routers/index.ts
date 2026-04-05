import { type RouterClient } from "@orpc/server";

import { healthRouter } from "#@/routers/health/index";
import { iamRouter } from "#@/routers/iam/index";

export const appRouter = {
  health: healthRouter,
  iam: iamRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
