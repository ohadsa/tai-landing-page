import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/layout";
import { getContent } from "@/lib/content";
import { imageExists } from "@/components/Figure";

describe("page metadata", () => {
  it("takes its title and description from the YAML seo block", () => {
    const { seo } = getContent();
    const metadata = generateMetadata();

    expect(metadata.title).toBe(seo.title);
    expect(metadata.description).toBe(seo.description);
    expect(metadata.openGraph?.title).toBe(seo.title);
  });

  it("takes the canonical url from the YAML rather than hardcoding it", () => {
    const { site } = getContent();
    const metadata = generateMetadata();

    // metadataBase is typed `string | URL`; normalise before comparing.
    expect(new URL(String(metadata.metadataBase)).origin).toBe(
      new URL(site.url).origin,
    );
    expect(metadata.openGraph?.url).toBe(site.url);
  });

  it("advertises og:image only when the file actually exists", () => {
    // Advertising an image that 404s renders as a blank card wherever the link
    // is shared, which is worse than having no image at all. Asserting the rule
    // rather than a snapshot of it keeps this honest whichever way the file goes.
    const { seo } = getContent();
    const images = generateMetadata().openGraph?.images;

    if (imageExists(seo.social_image)) {
      expect(images).toBeDefined();
      expect(JSON.stringify(images)).toContain(seo.social_image);
    } else {
      expect(images).toBeUndefined();
    }
  });

  it("stamps a build identifier so the live version is verifiable", () => {
    expect(generateMetadata().other?.build).toBeTruthy();
  });
});
