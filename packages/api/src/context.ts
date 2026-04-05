import { type Context as HonoContext } from "hono";

import { type AuthPort } from "@tsu-stack/core/iam/application/ports/auth.port";
import { type EventDispatcherPort } from "@tsu-stack/core/port/event-dispatcher.port";
import { type MediatorPort } from "@tsu-stack/core/port/mediator.port";
import { type getLogger } from "@tsu-stack/logger/server";

export type CreateContextOptions = {
  context: HonoContext;
  logger: ReturnType<typeof getLogger>;
  mediator: MediatorPort;
  events: EventDispatcherPort;
  auth: AuthPort;
};

export async function createContext({
  context,
  logger,
  mediator,
  events,
  auth,
}: CreateContextOptions) {
  const session = await auth.getSession(context.req.raw.headers);
  return {
    logger,
    mediator,
    events,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
