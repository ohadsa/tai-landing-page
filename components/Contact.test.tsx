import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Contact } from "@/components/Contact";
import { getContent } from "@/lib/content";

vi.mock("@/app/actions/contact", () => ({
  submitContact: vi.fn(async () => ({ status: "success" })),
}));

const contact = getContent().contact;

describe("Contact", () => {
  it("renders every field the lead needs", () => {
    render(<Contact contact={contact} />);
    for (const label of [
      contact.fields.name,
      contact.fields.email,
      contact.fields.phone,
      contact.fields.subject,
      contact.fields.message,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("carries a honeypot that no visitor can reach", () => {
    const { container } = render(<Contact contact={contact} />);
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="company"]',
    );

    expect(honeypot).not.toBeNull();
    // Off-screen rather than display:none, which bots skip, and out of the tab
    // order so a keyboard visitor never lands in it.
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(honeypot?.value).toBe("");
  });

  it("starts with no status message", () => {
    render(<Contact contact={contact} />);
    expect(screen.queryByText(contact.success_message)).toBeNull();
    expect(screen.queryByText(contact.error_message)).toBeNull();
  });

  it("announces status changes to screen readers", () => {
    const { container } = render(<Contact contact={contact} />);
    expect(container.querySelector(".form-message")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
