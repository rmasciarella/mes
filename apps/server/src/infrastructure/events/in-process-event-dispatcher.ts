import {
  type EventDispatcherPort,
  type EventHandler,
} from "@tsu-stack/core/port/event-dispatcher.port";
import { type DomainEvent } from "@tsu-stack/core/shared-kernel/events/domain-event";

export class InProcessEventDispatcher implements EventDispatcherPort {
  private handlers = new Map<string, EventHandler[]>();

  register<T extends DomainEvent>(eventType: T["eventType"], handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}
