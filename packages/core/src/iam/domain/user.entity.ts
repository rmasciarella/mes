import { type UserId } from "#@/iam/domain/user-id.value-object";

export type User = {
  readonly id: UserId;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly name: string;
  readonly image: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
