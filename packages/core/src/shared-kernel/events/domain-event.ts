export type DomainEvent<T extends string = string, P = unknown> = {
  readonly eventType: T;
  readonly occurredAt: Date;
  readonly payload: P;
};
