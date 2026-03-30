import { createFileRoute } from "@tanstack/react-router";

import { SignInForm } from "@/features/auth";

export const Route = createFileRoute("/{-$locale}/(centered-layout)/(guest)/sign-in/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();

  return <SignInForm redirectTo={redirect} />;
}
