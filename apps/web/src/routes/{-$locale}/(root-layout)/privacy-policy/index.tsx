import { createFileRoute } from "@tanstack/react-router";

import { PrivacyPolicyPage } from "@/pages/privacy-policy";

export const Route = createFileRoute("/{-$locale}/(root-layout)/privacy-policy/")({
  component: PrivacyPolicyPage,
});
