import { type UserId } from "#@/iam/domain/user-id.value-object";

export type Session = {
  readonly user: {
    readonly id: UserId;
    readonly [key: string]: unknown;
  };
};

export type AuthPort = {
  getSession(headers: Headers): Promise<Session | null>;
};
