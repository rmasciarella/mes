import { type GetCurrentUser } from "@tsu-stack/core/iam/application/query/get-current-user";

import { protectedProcedure } from "#@/index";

export const iamRouter = {
  data: protectedProcedure
    .route({
      description: "Retrieve the current authenticated user's data",
      method: "GET",
    })
    .handler(async ({ context }) => {
      const user = await context.mediator.send<GetCurrentUser>({
        _tag: "GetCurrentUser",
        userId: context.session.user.id,
      });

      return {
        message: "This is private",
        user,
      };
    }),
};
