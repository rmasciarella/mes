import { type UserId } from "#@/iam/domain/user-id.value-object";
import { type User } from "#@/iam/domain/user.entity";

export type UserRepositoryPort = {
  findById(id: UserId): Promise<User | null>;
};
