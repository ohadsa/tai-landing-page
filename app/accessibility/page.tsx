import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { LegalPage } from "@/components/LegalPage";

/**
 * Title and description come from the `legal.accessibility` block in
 * content/site.yaml. `metadataBase` is inherited from the root layout.
 */
export function generateMetadata(): Metadata {
  const { legal, site } = getContent();

  return {
    title: `${legal.accessibility.title} | ${site.name}`,
    description: legal.accessibility.description,
    alternates: { canonical: "/accessibility" },
  };
}

export default function Accessibility() {
  return <LegalPage doc={getContent().legal.accessibility} />;
}
