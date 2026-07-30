import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateRange,
  formatPrice,
  getContent,
  mailto,
} from "@/lib/content";

describe("getContent", () => {
  it("parses every top-level section the page composes", () => {
    const content = getContent();
    for (const key of [
      "site",
      "seo",
      "navigation",
      "hero",
      "writing",
      "about",
      "workshops",
      "testimonials",
      "newsletter",
      "contact",
      "social",
      "footer",
    ]) {
      expect(content).toHaveProperty(key);
    }
  });

  it("strips the trailing newline YAML folded blocks leave behind", () => {
    // Otherwise a quote renders as `own. ”` — a stray space before the
    // closing quotation mark.
    const content = getContent();
    const folded = [
      content.hero.description,
      content.testimonials.items[0].quote,
      content.contact.description,
      ...content.about.paragraphs,
    ];
    for (const value of folded) {
      expect(value).toBe(value.trim());
    }
  });

  it("reads fresh from disk on each call rather than caching", () => {
    // Caching would stop `next dev` from picking up YAML edits on refresh,
    // since Next only watches files imported as modules.
    expect(getContent()).not.toBe(getContent());
    expect(getContent()).toEqual(getContent());
  });
});

describe("formatDate", () => {
  it("renders an ISO date in long form", () => {
    expect(formatDate("2026-06-12")).toBe("12 June 2026");
  });

  it("returns the input unchanged when it is not a real date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateRange", () => {
  it("drops the repeated year within a single year", () => {
    expect(formatDateRange("2026-09-12", "2026-10-03")).toBe(
      "12 September – 3 October 2026",
    );
  });

  it("keeps both years when the range crosses one", () => {
    expect(formatDateRange("2026-12-20", "2027-01-10")).toBe(
      "20 December 2026 – 10 January 2027",
    );
  });
});

describe("formatPrice", () => {
  it("formats a known currency code", () => {
    expect(formatPrice(1200, "ILS")).toContain("1,200");
  });

  it("falls back to raw values for an unknown currency rather than throwing", () => {
    expect(formatPrice(1200, "NOTACURRENCY")).toBe("1200 NOTACURRENCY");
  });
});

describe("mailto", () => {
  it("encodes the subject", () => {
    expect(mailto("a@b.com", "Workshop question")).toBe(
      "mailto:a@b.com?subject=Workshop%20question",
    );
  });

  it("omits the query string when there is no subject", () => {
    expect(mailto("a@b.com")).toBe("mailto:a@b.com");
  });
});
