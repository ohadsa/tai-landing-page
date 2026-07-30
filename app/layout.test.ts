import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/layout";
import { getContent } from "@/lib/content";

describe("page metadata", () => {
  it("takes its title and description from the YAML seo block", () => {
    const { seo } = getContent();
    const metadata = generateMetadata();

    expect(metadata.title).toBe(seo.title);
    expect(metadata.description).toBe(seo.description);
    expect(metadata.openGraph?.title).toBe(seo.title);
  });

  it("omits og:image while the social preview file does not exist", () => {
    // Advertising an image that 404s renders as a blank card wherever the
    // link is shared, which is worse than having no image at all.
    const metadata = generateMetadata();
    expect(metadata.openGraph?.images).toBeUndefined();
  });
});
