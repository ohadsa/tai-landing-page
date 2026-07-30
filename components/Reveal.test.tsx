import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "@/components/Reveal";

describe("Reveal", () => {
  it("exposes the stagger index to CSS as --i", () => {
    const { container } = render(<Reveal index={3}>content</Reveal>);
    expect(container.firstElementChild?.getAttribute("style")).toContain(
      "--i: 3",
    );
  });

  it("omits the variable for the first item, which needs no delay", () => {
    const { container } = render(<Reveal index={0}>content</Reveal>);
    expect(container.firstElementChild?.getAttribute("style")).toBeNull();
  });

  it("keeps the reveal class alongside any passed className", () => {
    const { container } = render(<Reveal className="hero-visual">x</Reveal>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.classList.contains("reveal")).toBe(true);
    expect(el.classList.contains("hero-visual")).toBe(true);
  });
});
