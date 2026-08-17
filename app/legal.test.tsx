import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import Privacy from "@/app/privacy/page";
import Accessibility from "@/app/accessibility/page";
import { getContent, type LegalDocument } from "@/lib/content";

const content = getContent();

/**
 * Every document must print all of its own text, wherever it is rendered.
 *
 * The dialog demotes the title to an h2 so it sits under the page's existing
 * h1, so the level the caller expects is part of the assertion.
 */
function expectRendersInFull(
  doc: LegalDocument,
  scope: HTMLElement,
  titleLevel: 1 | 2,
) {
  const view = within(scope);
  expect(
    view.getByRole("heading", { level: titleLevel, name: doc.title }),
  ).toBeInTheDocument();
  expect(view.getByText(doc.updated_label)).toBeInTheDocument();
  expect(view.getByText(doc.intro)).toBeInTheDocument();

  for (const section of doc.sections) {
    expect(
      view.getByRole("heading", { level: titleLevel + 1, name: section.heading }),
    ).toBeInTheDocument();
    for (const paragraph of section.body) {
      expect(view.getByText(paragraph)).toBeInTheDocument();
    }
  }
}

/** The footer label that opens a given document, read from the YAML. */
function labelFor(key: "privacy" | "accessibility") {
  const link = content.footer.legal.find((item) => item.document === key);
  if (!link) throw new Error(`no footer link opens the ${key} document`);
  return link.label;
}

/** Opens a footer legal link the way an ordinary reader would. */
function openFromFooter(key: "privacy" | "accessibility") {
  fireEvent.click(screen.getByRole("link", { name: labelFor(key) }));
  return screen.getByRole("dialog");
}

describe("legal documents in a dialog", () => {
  it("opens the privacy policy over the page instead of navigating", () => {
    render(<Home />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = openFromFooter("privacy");
    expectRendersInFull(content.legal.privacy, dialog, 2);
  });

  it("opens the accessibility statement the same way", () => {
    render(<Home />);
    const dialog = openFromFooter("accessibility");
    expectRendersInFull(content.legal.accessibility, dialog, 2);
  });

  it("closes on the close button", () => {
    render(<Home />);
    openFromFooter("privacy");
    fireEvent.click(
      screen.getByRole("button", { name: content.legal.close_label }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("names itself by its title for a screen reader", () => {
    render(<Home />);
    const dialog = openFromFooter("privacy");
    const labelledBy = dialog.getAttribute("aria-labelledby");

    expect(labelledBy).toBeTruthy();
    expect(dialog.querySelector(`#${labelledBy}`)).toHaveTextContent(
      content.legal.privacy.title,
    );
  });

  it("marks the English text as English and left-to-right", () => {
    // The site is Hebrew and right-to-left. Without this the punctuation in an
    // English sentence lands on the wrong side of the line.
    render(<Home />);
    const doc = openFromFooter("privacy").querySelector(".legal-doc");

    expect(doc).toHaveAttribute("lang", "en");
    expect(doc).toHaveAttribute("dir", "ltr");
  });
});

describe("the legal links stay real links", () => {
  it("keeps an address on every link, so it works without the script", () => {
    // A required statement must not be reachable only through JavaScript: the
    // href is what serves a crawler, a new tab, or a click that lands before
    // hydration.
    render(<Home />);
    for (const item of content.footer.legal) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
    expect(content.footer.legal.map((item) => item.href)).toEqual([
      "/privacy",
      "/accessibility",
    ]);
  });

  it("lets a modified click through to the browser", () => {
    // Cmd/Ctrl-click means "open in a new tab". Swallowing it would break a
    // reader's expectation and strand them in a dialog they did not ask for.
    render(<Home />);
    fireEvent.click(screen.getByRole("link", { name: labelFor("privacy") }), {
      metaKey: true,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("standalone fallback pages", () => {
  it("serves the whole privacy policy at its own address", () => {
    render(<Privacy />);
    expectRendersInFull(
      content.legal.privacy,
      screen.getByRole("main"),
      1,
    );
  });

  it("serves the whole accessibility statement at its own address", () => {
    render(<Accessibility />);
    expectRendersInFull(
      content.legal.accessibility,
      screen.getByRole("main"),
      1,
    );
  });

  it("offers a way back to the homepage", () => {
    render(<Privacy />);
    expect(
      screen.getByRole("link", { name: content.legal.back_label }),
    ).toHaveAttribute("href", "/");
  });
});

describe("accessibility statement content", () => {
  it("claims no conformance level that nobody has verified", () => {
    // The statement's whole value rests on being true. A claim of full SI 5568
    // conformance with no audit behind it is the genuinely dangerous edit — it
    // is what a visitor relies on and what an opponent can disprove in one
    // test. Pinned here so replacing it has to be deliberate.
    const body = content.legal.accessibility.sections.flatMap((s) => s.body);
    const clause = body.find((text) => text.includes("SI 5568"));
    const disclaimer = body.find((text) =>
      text.includes("does not assert complete conformance"),
    );

    expect(clause).toBeDefined();
    expect(disclaimer).toBeDefined();
    expect(body.join(" ")).not.toMatch(/fully conforms|complies fully/i);
  });

  it("lists only the coordinator details that are filled in", () => {
    // An empty name or phone must be absent, not a label with nothing after
    // it. The email is always there, so the section can never end up with no
    // way to reach anyone — the part that matters to a visitor and to the
    // regulations alike.
    const contact = content.legal.accessibility.contact;
    expect(contact).toBeDefined();
    if (!contact) return;

    render(<Accessibility />);
    const heading = screen.getByRole("heading", { name: contact.heading });
    const block = within(heading.parentElement as HTMLElement);

    expect(block.getByText(contact.labels.email)).toBeInTheDocument();
    expect(block.getByRole("link", { name: contact.email })).toHaveAttribute(
      "href",
      `mailto:${contact.email}`,
    );

    for (const [label, value] of [
      [contact.labels.name, contact.name],
      [contact.labels.phone, contact.phone],
    ] as const) {
      expect(block.queryAllByText(label)).toHaveLength(value.trim() ? 1 : 0);
    }
  });
});

describe("navigating between the homepage and a legal page", () => {
  it("sends legal-page nav links home before they scroll", () => {
    // The YAML holds bare fragments for the one-page site. Unprefixed,
    // "#workshops" would look for a section of the privacy document.
    render(<Privacy />);
    for (const item of content.navigation) {
      const links = screen.getAllByRole("link", { name: item.label });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link).toHaveAttribute("href", `/${item.href}`);
      }
    }
  });

  it("leaves the homepage's own nav links as bare fragments", () => {
    render(<Home />);
    for (const item of content.navigation) {
      for (const link of screen.getAllByRole("link", { name: item.label })) {
        expect(link).toHaveAttribute("href", item.href);
      }
    }
  });
});
