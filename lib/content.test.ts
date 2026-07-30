import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { isConfiguredEndpoint, mailto } from "@/lib/forms";

describe("getContent", () => {
  it("parses every top-level section the page composes", () => {
    const content = getContent();
    for (const key of [
      "site",
      "ui",
      "seo",
      "navigation",
      "navigation_cta",
      "hero",
      "writing",
      "about",
      "workshops",
      "experience",
      "testimonials",
      "newsletter",
      "contact",
      "social",
      "footer",
    ]) {
      expect(content).toHaveProperty(key);
    }
  });

  it("is a right-to-left Hebrew document", () => {
    const { site } = getContent();
    expect(site.language).toBe("he");
    expect(site.direction).toBe("rtl");
  });

  it("has no trailing slash on the site url", () => {
    // A trailing slash produces doubled slashes in resolved asset URLs.
    expect(getContent().site.url).not.toMatch(/\/$/);
  });

  it("leaves no line breaks inside prose values", () => {
    const content = getContent();
    const samples = [
      content.hero.description,
      content.testimonials.items[0].quote,
      content.contact.description,
      ...content.about.paragraphs,
    ];
    for (const value of samples) {
      expect(value).not.toMatch(/[\r\n]/);
    }
  });

  it("preserves the spaces that separate hero title segments", () => {
    // The segments carry meaningful leading/trailing spaces so the accented
    // word stands apart. Trimming them welds the title into one unbreakable
    // token that overflows its grid column instead of wrapping.
    const segments = getContent().hero.title_segments;
    const joined = segments.map((s) => s.text).join("");

    expect(joined).toContain(" ");
    expect(joined).not.toMatch(/\S{25,}/);
    for (const word of joined.split(/\s+/)) {
      expect(word.length).toBeLessThan(20);
    }
  });

  it("reads fresh from disk on each call rather than caching", () => {
    // Caching would stop `next dev` from picking up YAML edits on refresh,
    // since Next only watches files imported as modules.
    expect(getContent()).not.toBe(getContent());
    expect(getContent()).toEqual(getContent());
  });

  it("gives every hero title segment text", () => {
    for (const segment of getContent().hero.title_segments) {
      expect(segment.text.length).toBeGreaterThan(0);
    }
  });

  it("gives every image an alt description", () => {
    const content = getContent();
    const images = [
      content.hero.portrait,
      content.about.portrait,
      ...content.writing.articles.map((a) => a.image),
      ...content.workshops.items.map((w) => w.image),
    ];
    for (const image of images) {
      expect(image.alt.trim().length).toBeGreaterThan(0);
      expect(image.src.startsWith("/")).toBe(true);
    }
  });
});

describe("isConfiguredEndpoint", () => {
  it('rejects "#", which the reference template shipped as a placeholder', () => {
    // As a form action "#" posts to the current page: the field clears, the
    // visitor assumes success, and nothing is sent anywhere.
    expect(isConfiguredEndpoint("#")).toBe(false);
  });

  it("rejects empty and whitespace-only values", () => {
    expect(isConfiguredEndpoint("")).toBe(false);
    expect(isConfiguredEndpoint("   ")).toBe(false);
    expect(isConfiguredEndpoint(undefined)).toBe(false);
  });

  it("accepts a real endpoint", () => {
    expect(isConfiguredEndpoint("https://formspree.io/f/abcdwxyz")).toBe(true);
  });
});

describe("mailto", () => {
  it("percent-encodes spaces rather than using plus signs", () => {
    // Mail clients render a literal "+" in a subject line.
    const url = mailto("a@b.com", "שאלה על סדנה");
    expect(url).not.toContain("+");
    expect(url.startsWith("mailto:a@b.com?subject=")).toBe(true);
  });

  it("includes a body when given one", () => {
    expect(mailto("a@b.com", "s", "hello")).toContain("body=hello");
  });

  it("omits the query string when there is no subject or body", () => {
    expect(mailto("a@b.com")).toBe("mailto:a@b.com");
  });
});
