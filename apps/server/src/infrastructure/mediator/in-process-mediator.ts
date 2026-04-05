import {
  type MediatorPort,
  type PipelineBehavior,
  type Request,
  type RequestHandler,
  type ResponseOf,
} from "@tsu-stack/core/port/mediator.port";

type AnyHandler = (request: never) => Promise<unknown>;

export class InProcessMediator implements MediatorPort {
  private handlers = new Map<string, AnyHandler>();
  private behaviors: PipelineBehavior[] = [];

  register<R extends Request>(tag: string, handler: RequestHandler<R>): this {
    this.handlers.set(tag, handler as AnyHandler);
    return this;
  }

  pipe(behavior: PipelineBehavior): this {
    this.behaviors.push(behavior);
    return this;
  }

  async send<R extends Request>(request: R): Promise<ResponseOf<R>> {
    const handler = this.handlers.get(request._tag);
    if (!handler) {
      throw new Error(`No handler registered for "${request._tag}"`);
    }

    const invokeHandler = () => handler(request as never) as Promise<ResponseOf<R>>;

    // Build the pipeline from right to left so behaviors execute in registration order
    let next: () => Promise<ResponseOf<R>> = invokeHandler;
    for (let i = this.behaviors.length - 1; i >= 0; i--) {
      const behavior = this.behaviors[i]!;
      const current = next;
      next = () => behavior(request, current) as Promise<ResponseOf<R>>;
    }

    return next();
  }
}
