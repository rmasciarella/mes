import Content from "@/pages/privacy-policy/content/index.mdx";
import { Container } from "@/shared/ui/container";

export function PrivacyPolicyPage() {
  return (
    <Container className="prose not-dark:prose-invert">
      <Content />
    </Container>
  );
}
