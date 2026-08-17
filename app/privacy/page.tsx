import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { LegalPage } from "@/components/LegalPage";

/**
 * Title and description come from the `legal.privacy` block in
 * content/site.yaml, so editing the policy also updates its tab and its
 * search-result snippet. `metadataBase` is inherited from the root layout.
 */
export function generateMetadata(): Metadata {
  const { legal, site } = getContent();

  return {
    title: `${legal.privacy.title} | ${site.name}`,
    description: legal.privacy.description,
    alternates: { canonical: "/privacy" },
  };
}

export default function Privacy() {
  return <LegalPage doc={getContent().legal.privacy} />;
}
