import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { getAuthQueryOptions } from "#@/react/tanstack-start/queries";

export function useAuth() {
  const { data: user, isPending } = useQuery(getAuthQueryOptions());
  return { isPending, user };
}

export function useAuthSuspense() {
  const { data: user } = useSuspenseQuery(getAuthQueryOptions());
  return { user };
}
