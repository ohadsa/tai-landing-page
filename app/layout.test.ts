import { describe, expect, it } from "vitest";
import { metadata } from "@/app/layout";

describe("page metadata", () => {
  it("titles the page with the brand name in two-word form", () => {
    expect(metadata.title).toBe("Tai Atar");
  });

  it("has a description", () => {
    expect(metadata.description).toBeTruthy();
  });

  it("sets an Open Graph title matching the page title", () => {
    expect(metadata.openGraph?.title).toBe("Tai Atar");
  });
});
