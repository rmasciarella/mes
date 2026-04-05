import { type UserRepositoryPort } from "#@/iam/application/ports/user.repository.port";
import { type UserId } from "#@/iam/domain/user-id.value-object";
import { type User } from "#@/iam/domain/user.entity";
import { type Request, type RequestHandler } from "#@/port/mediator.port";

export type GetCurrentUser = Request<User | null> & {
  readonly _tag: "GetCurrentUser";
  readonly userId: UserId;
};

export function getCurrentUserHandler(deps: {
  userRepo: UserRepositoryPort;
}): RequestHandler<GetCurrentUser> {
  return (request) => deps.userRepo.findById(request.userId);
}
