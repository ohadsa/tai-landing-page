import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("coming-soon page", () => {
  it("renders the brand name as two capitalised words in the DOM", () => {
    render(<Home />);
    // Uppercase display is a CSS treatment; the DOM text must stay "Tai Atar"
    // so screen readers pronounce it as a name rather than spelling it out.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Tai Atar$/,
    );
  });

  it("renders the coming soon subline", () => {
    render(<Home />);
    expect(screen.getByText("coming soon")).toBeInTheDocument();
  });

  it("renders the copyright footer", () => {
    render(<Home />);
    expect(screen.getByText("© 2026 Tai Atar")).toBeInTheDocument();
  });

  it("renders no other text", () => {
    const { container } = render(<Home />);
    // textContent runs adjacent elements together with no separator, so the
    // expectation is the three strings concatenated. Any stray copy added to
    // the page breaks this.
    const expected = ["Tai Atar", "coming soon", "© 2026 Tai Atar"].join("");
    expect(container.textContent).toBe(expected);
  });
});
