import { type DomainEvent } from "#@/shared-kernel/events/domain-event";

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export type EventDispatcherPort = {
  dispatch(event: DomainEvent): void | Promise<void>;
  register<T extends DomainEvent>(eventType: T["eventType"], handler: EventHandler<T>): void;
};
