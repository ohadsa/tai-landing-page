import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { getContent } from "@/lib/content";
import { isConfiguredEndpoint } from "@/lib/forms";

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

  it("breaks the hero headline onto a second line", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", { level: 1 });

    for (const segment of content.hero.title_segments) {
      expect(heading).toHaveTextContent(segment.text);
    }
    // A real break, not a wrap that happens to land there at one width.
    expect(heading.querySelectorAll("br")).toHaveLength(
      content.hero.title_segments.filter((s) => s.break_before).length,
    );
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

  it("renders each workshop with its detail rows", () => {
    render(<Home />);
    for (const workshop of content.workshops.items) {
      expect(
        screen.getByRole("heading", { name: workshop.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(workshop.dates_display)).toBeInTheDocument();
      expect(screen.getByText(workshop.structure_display)).toBeInTheDocument();
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

  it("offers a submit button and a honeypot the visitor cannot reach", () => {
    const { container } = render(<Home />);
    expect(
      screen.getByRole("button", { name: content.contact.fields.submit }),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="company"]')).not.toBeNull();
  });

  it("collects every lead field the form promises", () => {
    render(<Home />);
    for (const label of [
      content.contact.fields.name,
      content.contact.fields.email,
      content.contact.fields.phone,
      content.contact.fields.message,
    ]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    // The subject is a select, so it always carries one of its options rather
    // than needing to be required.
    expect(screen.getByLabelText(content.contact.fields.subject)).toHaveValue(
      content.contact.subjects[0],
    );
  });

  it("pre-fills the contact form when a workshop place is reserved", () => {
    render(<Home />);

    const workshop = content.workshops.items[0];
    const card = screen
      .getByRole("heading", { name: workshop.title })
      .closest(".workshop-card") as HTMLElement;
    fireEvent.click(
      within(card).getByRole("link", { name: content.workshops.reserve_label }),
    );

    expect(screen.getByLabelText(content.contact.fields.subject)).toHaveValue(
      content.contact.reserve_subject,
    );
    expect(screen.getByLabelText(content.contact.fields.message)).toHaveValue(
      content.contact.reserve_message.replace("{workshop}", workshop.title),
    );
  });

  it("keeps reserve_subject among the offered subjects", () => {
    // A subject missing from the list would render the select blank.
    expect(content.contact.subjects).toContain(content.contact.reserve_subject);
  });

  it("offers every contact subject as an option", () => {
    render(<Home />);
    const select = screen.getByLabelText(content.contact.fields.subject);
    for (const subject of content.contact.subjects) {
      expect(within(select).getByRole("option", { name: subject })).toBeInTheDocument();
    }
  });

  it("renders the copyright in the footer", () => {
    render(<Home />);
    expect(screen.getByText(content.footer.copyright)).toBeInTheDocument();
  });

  it("ships a legal link only once it points somewhere", () => {
    // "#" is not an inert href — the browser reads it as the top of the
    // document, so a placeholder פרטיות link scrolled the reader back to the
    // hero instead of doing nothing. Absent is better than misleading.
    render(<Home />);
    for (const item of content.footer.legal) {
      expect(screen.queryAllByRole("link", { name: item.label })).toHaveLength(
        isConfiguredEndpoint(item.href) ? 1 : 0,
      );
    }
  });

  it("ships a social icon only once its profile URL is real", () => {
    // An icon still pointing at "#" looks like a working link and goes
    // nowhere, so it stays out of the footer until the URL is filled in.
    render(<Home />);
    for (const item of content.social.items) {
      expect(screen.queryAllByRole("link", { name: item.label })).toHaveLength(
        isConfiguredEndpoint(item.href) ? 1 : 0,
      );
    }
  });

  it("opens each social profile in its own tab", () => {
    // The profiles are on other sites; replacing the page would send a reader
    // who only wanted a glance at Instagram away from the site entirely.
    render(<Home />);
    const configured = content.social.items.filter((item) =>
      isConfiguredEndpoint(item.href),
    );
    expect(configured.length).toBeGreaterThan(0);
    for (const item of configured) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("target", "_blank");
      // noreferrer withholds the referrer; noopener denies the opened tab a
      // handle back onto this window.
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
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
