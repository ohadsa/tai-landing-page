import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { getContent } from "@/lib/content";

const content = getContent();

describe("page renders from content/site.yaml", () => {
  it("uses the hero title from the YAML as the h1", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      content.hero.title,
    );
  });

  it("renders every navigation item with its href", () => {
    render(<Home />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of content.navigation) {
      expect(
        within(nav).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }
  });

  it("renders every article, linking out to its url", () => {
    render(<Home />);
    for (const article of content.writing.articles) {
      const heading = screen.getByRole("heading", { name: article.title });
      expect(heading).toBeInTheDocument();
      expect(heading.closest("a")).toHaveAttribute("href", article.url);
    }
  });

  it("derives workshop availability from capacity and available_places", () => {
    render(<Home />);
    for (const workshop of content.workshops.items) {
      expect(
        screen.getByText(
          `${workshop.available_places} of ${workshop.capacity} places left`,
        ),
      ).toBeInTheDocument();
    }
  });

  it("gives each contact subject a mailto link with the subject prefilled", () => {
    render(<Home />);
    for (const subject of content.contact.subjects) {
      const link = screen.getByRole("link", { name: subject });
      expect(link).toHaveAttribute(
        "href",
        `mailto:${content.contact.email}?subject=${encodeURIComponent(subject)}`,
      );
    }
  });

  it("hides the newsletter form while form_action is empty", () => {
    // An empty action would post to the current page: the visitor sees the
    // field clear and assumes success, and nobody receives anything.
    expect(content.newsletter.form_action.trim()).toBe("");
    render(<Home />);
    expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  });

  it("renders social links that have a url and skips the empty ones", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      content.social.instagram,
    );
    expect(screen.queryByRole("link", { name: "Facebook" })).toBeNull();
    expect(screen.queryByRole("link", { name: "LinkedIn" })).toBeNull();
  });

  it("falls back to an accessible placeholder for images that do not exist", () => {
    render(<Home />);
    expect(
      screen.getByRole("img", { name: content.hero.portrait.alt }),
    ).toBeInTheDocument();
  });

  it("renders the footer copyright from the YAML", () => {
    render(<Home />);
    expect(screen.getByText(content.footer.copyright)).toBeInTheDocument();
  });
});
