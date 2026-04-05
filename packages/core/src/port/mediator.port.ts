/**
 * Base interface for all requests (commands and queries).
 * TResponse is the expected return type (void for commands).
 * Every request must have a unique `_tag` discriminator.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Request<TResponse = any> = {
  readonly _tag: string;
  /** @internal Phantom field -- carries the response type. Do not set at runtime. */
  readonly __response?: TResponse;
};

/**
 * Extracts the response type from a Request.
 */
export type ResponseOf<R> = R extends Request<infer T> ? T : never;

/**
 * A handler that processes a specific request type and returns its response.
 */
export type RequestHandler<R extends Request> = (request: R) => Promise<ResponseOf<R>>;

/**
 * Pipeline behavior that wraps handler execution.
 * Call `next()` to continue the pipeline, or short-circuit by returning directly.
 */
export type PipelineBehavior = (request: Request, next: () => Promise<unknown>) => Promise<unknown>;

/**
 * The mediator dispatches a request to its registered handler,
 * running it through the pipeline behavior chain.
 */
export type MediatorPort = {
  send<R extends Request>(request: R): Promise<ResponseOf<R>>;
};
