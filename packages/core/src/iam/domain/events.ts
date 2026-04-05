import { type User } from "#@/iam/domain/user.entity";
import { type DomainEvent } from "#@/shared-kernel/events/domain-event";

export type UserRegistered = DomainEvent<"UserRegistered", { user: User }>;
