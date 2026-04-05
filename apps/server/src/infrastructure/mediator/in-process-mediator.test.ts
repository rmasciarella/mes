import { describe, expect, it, vi } from "vite-plus/test";

import {
  type PipelineBehavior,
  type Request,
  type RequestHandler,
} from "@tsu-stack/core/port/mediator.port";

import { InProcessMediator } from "#@/infrastructure/mediator/in-process-mediator";

type Greet = Request<string> & {
  readonly _tag: "Greet";
  readonly name: string;
};

const greetHandler: RequestHandler<Greet> = async (req) => `Hello, ${req.name}`;

type NoOp = Request<void> & {
  readonly _tag: "NoOp";
};

describe("InProcessMediator", () => {
  it("dispatches a request to its registered handler", async () => {
    const mediator = new InProcessMediator().register<Greet>("Greet", greetHandler);

    const result = await mediator.send<Greet>({ _tag: "Greet", name: "World" });
    expect(result).toBe("Hello, World");
  });

  it("throws when no handler is registered", async () => {
    const mediator = new InProcessMediator();

    await expect(mediator.send<NoOp>({ _tag: "NoOp" })).rejects.toThrow(
      'No handler registered for "NoOp"',
    );
  });

  it("runs pipeline behaviors in registration order", async () => {
    const order: string[] = [];

    const first: PipelineBehavior = async (_req, next) => {
      order.push("first:before");
      const result = await next();
      order.push("first:after");
      return result;
    };

    const second: PipelineBehavior = async (_req, next) => {
      order.push("second:before");
      const result = await next();
      order.push("second:after");
      return result;
    };

    const mediator = new InProcessMediator()
      .pipe(first)
      .pipe(second)
      .register<Greet>("Greet", greetHandler);

    await mediator.send<Greet>({ _tag: "Greet", name: "Pipeline" });

    expect(order).toEqual(["first:before", "second:before", "second:after", "first:after"]);
  });

  it("allows pipeline behaviors to short-circuit", async () => {
    const handler = vi.fn();

    const shortCircuit: PipelineBehavior = async () => "short-circuited";

    const mediator = new InProcessMediator()
      .pipe(shortCircuit)
      .register<Greet>("Greet", handler as unknown as RequestHandler<Greet>);

    const result = await mediator.send<Greet>({ _tag: "Greet", name: "Test" });

    expect(result).toBe("short-circuited");
    expect(handler).not.toHaveBeenCalled();
  });
});
