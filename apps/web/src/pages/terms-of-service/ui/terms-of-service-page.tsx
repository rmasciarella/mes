import Content from "@/pages/terms-of-service/content/index.mdx";
import { Container } from "@/shared/ui/container";

export function TermsOfServicePage() {
  return (
    <Container className="prose not-dark:prose-invert">
      <Content />
    </Container>
  );
}
