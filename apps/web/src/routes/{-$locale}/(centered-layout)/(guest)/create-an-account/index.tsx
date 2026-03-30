import { createFileRoute } from "@tanstack/react-router";

import { CreateAnAccountForm } from "@/features/auth";

export const Route = createFileRoute("/{-$locale}/(centered-layout)/(guest)/create-an-account/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();

  return <CreateAnAccountForm redirectTo={redirect} />;
}
