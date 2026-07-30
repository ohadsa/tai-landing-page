import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { getContent } from "@/lib/content";

const content = getContent();

describe("page renders from content/site.yaml", () => {
  it("assembles the h1 from the hero title segments, spacing intact", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });
    const expected = content.hero.title_segments.map((s) => s.text).join("");

    expect(heading).toHaveTextContent(expected.trim());
    // Guards the segment spacing: without it the words run together into a
    // single token too wide to wrap.
    expect(heading.textContent).not.toMatch(/\S{25,}/);
  });

  it("renders the hero heading outside any scroll-reveal wrapper", () => {
    // The hero is above the fold and animates on load. Wrapped in .reveal it
    // would depend on JavaScript to become visible, and its opacity would also
    // fight the scroll-driven exit animation on .hero-copy.
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1 }).closest(".reveal"),
    ).toBeNull();
  });

  it("renders every navigation item plus the CTA", () => {
    render(<Home />);
    const nav = screen.getByRole("navigation", {
      name: content.ui.main_navigation_aria,
    });
    for (const item of content.navigation) {
      expect(within(nav).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
    expect(
      within(nav).getByRole("link", { name: content.navigation_cta.label }),
    ).toHaveAttribute("href", content.navigation_cta.href);
  });

  it("renders every article with its link and date", () => {
    render(<Home />);
    for (const article of content.writing.articles) {
      const heading = screen.getByRole("heading", { name: article.title });
      expect(heading.closest("a")).toHaveAttribute("href", article.url);
      expect(screen.getByText(article.published_label)).toBeInTheDocument();
    }
  });

  it("renders each workshop with its detail rows and price", () => {
    render(<Home />);
    for (const workshop of content.workshops.items) {
      expect(
        screen.getByRole("heading", { name: workshop.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(workshop.dates_display)).toBeInTheDocument();
      expect(screen.getByText(workshop.availability_display)).toBeInTheDocument();
      expect(screen.getByText(workshop.price_display)).toBeInTheDocument();
    }
  });

  it("renders every experience item", () => {
    render(<Home />);
    for (const item of content.experience.items) {
      expect(screen.getByText(item.number)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: item.title })).toBeInTheDocument();
    }
  });

  it("renders every testimonial with its attribution", () => {
    render(<Home />);
    for (const item of content.testimonials.items) {
      expect(screen.getByText(item.quote)).toBeInTheDocument();
      expect(screen.getByText(item.attribution_display)).toBeInTheDocument();
    }
  });

  it("hides the newsletter entirely while form_action is unset", () => {
    // A form posting nowhere would clear the field and imply success while the
    // address reaches no one.
    expect(content.newsletter.form_action.trim()).toBe("");
    render(<Home />);
    expect(
      screen.queryByRole("button", { name: content.newsletter.button_label }),
    ).toBeNull();
  });

  it("shows the contact form with a mailto notice while unconfigured", () => {
    render(<Home />);
    expect(
      screen.getByRole("button", { name: content.contact.fields.submit }),
    ).toBeInTheDocument();
    // The visitor is told where the message will go before they submit.
    expect(
      screen.getByText(content.contact.mailto_fallback_note),
    ).toBeInTheDocument();
  });

  it("offers every contact subject as an option", () => {
    render(<Home />);
    const select = screen.getByLabelText(content.contact.fields.subject);
    for (const subject of content.contact.subjects) {
      expect(within(select).getByRole("option", { name: subject })).toBeInTheDocument();
    }
  });

  it("renders social and legal links in the footer", () => {
    render(<Home />);
    for (const item of [...content.social.items, ...content.footer.legal]) {
      expect(screen.getAllByRole("link", { name: item.label }).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(content.footer.copyright)).toBeInTheDocument();
  });

  it("falls back to an accessible placeholder for images that do not exist", () => {
    render(<Home />);
    expect(
      screen.getByRole("img", { name: content.hero.portrait.alt }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: content.about.portrait.alt }),
    ).toBeInTheDocument();
  });
});
