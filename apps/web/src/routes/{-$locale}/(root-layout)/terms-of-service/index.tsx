import { createFileRoute } from "@tanstack/react-router";

import { TermsOfServicePage } from "@/pages/terms-of-service";

export const Route = createFileRoute("/{-$locale}/(root-layout)/terms-of-service/")({
  component: TermsOfServicePage,
});
