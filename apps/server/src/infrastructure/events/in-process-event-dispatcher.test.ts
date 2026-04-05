import { describe, expect, it, vi } from "vite-plus/test";

import { type DomainEvent } from "@tsu-stack/core/shared-kernel/events/domain-event";

import { InProcessEventDispatcher } from "#@/infrastructure/events/in-process-event-dispatcher";

type TestEvent = DomainEvent<"TestEvent", { value: string }>;

function makeTestEvent(value: string): TestEvent {
  return { eventType: "TestEvent", occurredAt: new Date(), payload: { value } };
}

describe("InProcessEventDispatcher", () => {
  it("dispatches to registered handlers", async () => {
    const dispatcher = new InProcessEventDispatcher();
    const handler = vi.fn();

    dispatcher.register<TestEvent>("TestEvent", handler);
    await dispatcher.dispatch(makeTestEvent("hello"));

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]![0].payload.value).toBe("hello");
  });

  it("dispatches to multiple handlers for the same event type", async () => {
    const dispatcher = new InProcessEventDispatcher();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    dispatcher.register<TestEvent>("TestEvent", handler1);
    dispatcher.register<TestEvent>("TestEvent", handler2);
    await dispatcher.dispatch(makeTestEvent("world"));

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("does not dispatch to handlers of different event types", async () => {
    const dispatcher = new InProcessEventDispatcher();
    const handler = vi.fn();

    dispatcher.register("OtherEvent", handler);
    await dispatcher.dispatch(makeTestEvent("ignored"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("handles dispatch with no registered handlers", async () => {
    const dispatcher = new InProcessEventDispatcher();
    await expect(dispatcher.dispatch(makeTestEvent("orphan"))).resolves.toBeUndefined();
  });
});
