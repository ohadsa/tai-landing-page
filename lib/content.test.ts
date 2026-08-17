import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import {
  isConfiguredEndpoint,
  mailto,
  rejectedDespiteOk,
  wasAccepted,
} from "@/lib/forms";

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
      content.writing.introduction,
      content.testimonials.items[0].quote,
      content.contact.description,
      ...content.about.paragraphs,
    ];
    for (const value of samples) {
      expect(value).not.toMatch(/[\r\n]/);
    }
  });

  it("separates every hero title segment from the one before it", () => {
    // Adjacent segments need either `break_before` or a leading/trailing space
    // between them. With neither they weld into one unbreakable token that
    // overflows its grid column instead of wrapping.
    const segments = getContent().hero.title_segments;

    segments.forEach((segment, index) => {
      if (index === 0) return;
      const separated =
        Boolean(segment.break_before) ||
        segments[index - 1].text.endsWith(" ") ||
        segment.text.startsWith(" ");
      expect(separated).toBe(true);
    });

    for (const segment of segments) {
      for (const word of segment.text.trim().split(/\s+/)) {
        expect(word.length).toBeLessThan(20);
      }
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

describe("rejectedDespiteOk", () => {
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  it('catches FormSubmit\'s 200 with {"success":"false"}', async () => {
    // Returned until the form is activated. Trusting the status code would
    // thank the visitor for a message that reached no one.
    expect(
      await rejectedDespiteOk(
        json({ success: "false", message: "This form needs Activation." }),
      ),
    ).toBe(true);
  });

  it("catches a Formspree validation failure", async () => {
    expect(await rejectedDespiteOk(json({ ok: false }))).toBe(true);
    expect(
      await rejectedDespiteOk(json({ errors: [{ message: "bad email" }] })),
    ).toBe(true);
  });

  it("passes a genuine success through", async () => {
    expect(await rejectedDespiteOk(json({ success: "true" }))).toBe(false);
    expect(await rejectedDespiteOk(json({ ok: true }))).toBe(false);
    expect(await rejectedDespiteOk(json({ errors: [] }))).toBe(false);
  });

  it("treats an unrecognised body as success", async () => {
    // Never report a working endpoint as broken just because its reply is an
    // empty body or a shape we have not seen.
    expect(await rejectedDespiteOk(new Response("", { status: 200 }))).toBe(false);
    expect(await rejectedDespiteOk(new Response("OK", { status: 200 }))).toBe(false);
  });

  it("leaves the body readable for any later consumer", async () => {
    const response = json({ success: "true" });
    await rejectedDespiteOk(response);
    await expect(response.json()).resolves.toEqual({ success: "true" });
  });
});

describe("wasAccepted", () => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  it("accepts an unfollowed redirect", async () => {
    // FormSubmit's alias endpoint answers success with a 302. Following it
    // fails CORS, so the fetch uses redirect: "manual" and this opaque
    // response — whose only readable field is its type — is the acceptance.
    const opaque = Response.error();
    Object.defineProperty(opaque, "type", { value: "opaqueredirect" });
    expect(await wasAccepted(opaque)).toBe(true);
  });

  it("rejects a 200 whose body reports failure", async () => {
    expect(await wasAccepted(json({ success: "false" }))).toBe(false);
  });

  it("rejects a genuine error status", async () => {
    expect(await wasAccepted(json({ error: "nope" }, 500))).toBe(false);
  });

  it("accepts a plain success", async () => {
    expect(await wasAccepted(json({ success: "true" }))).toBe(true);
    expect(await wasAccepted(new Response("", { status: 200 }))).toBe(true);
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
