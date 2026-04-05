import { eq } from "drizzle-orm";

import { type UserRepositoryPort } from "@tsu-stack/core/iam/application/ports/user.repository.port";
import { type UserId } from "@tsu-stack/core/iam/domain/user-id.value-object";
import { type User } from "@tsu-stack/core/iam/domain/user.entity";

import { type db as Database } from "#@/index";
import { user } from "#@/schema/index";

export class UserRepository implements UserRepositoryPort {
  constructor(private readonly db: typeof Database) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.select().from(user).where(eq(user.id, id)).limit(1);
    if (row.length === 0) return null;
    const u = row[0]!;
    return {
      id: u.id as UserId,
      email: u.email,
      emailVerified: u.emailVerified,
      name: u.name,
      image: u.image,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}
