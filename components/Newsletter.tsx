"use client";

import { useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/content";
import { isConfiguredEndpoint } from "@/lib/forms";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Renders only when `newsletter.form_action` names a real endpoint.
 *
 * The reference design shipped `action="#"` with a script that printed a
 * thank-you message and sent nothing. That is the one behaviour worth refusing:
 * a visitor believes they subscribed, and no one ever receives the address.
 * With no endpoint configured the section is simply absent.
 */
export function Newsletter({
  newsletter,
}: {
  newsletter: SiteContent["newsletter"];
}) {
  const action = newsletter.form_action?.trim();
  const [status, setStatus] = useState<Status>("idle");

  if (!isConfiguredEndpoint(action)) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");

    try {
      const response = await fetch(action as string, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "success"
      ? newsletter.success_message
      : status === "error"
        ? newsletter.error_message
        : newsletter.privacy_note;

  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <div className="container newsletter-inner">
        <p className="eyebrow">{newsletter.eyebrow}</p>
        <h2 className="section-title" id="newsletter-title">
          {newsletter.title}
        </h2>
        <p className="newsletter-description">{newsletter.description}</p>

        <form className="newsletter-form" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="newsletter-name">
            {newsletter.name_placeholder}
          </label>
          <input
            id="newsletter-name"
            type="text"
            name="first_name"
            placeholder={newsletter.name_placeholder}
            autoComplete="given-name"
          />

          <label className="visually-hidden" htmlFor="newsletter-email">
            {newsletter.email_placeholder}
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            placeholder={newsletter.email_placeholder}
            autoComplete="email"
            required
          />

          <button type="submit" disabled={status === "sending"}>
            {status === "sending"
              ? newsletter.sending_label
              : newsletter.button_label}
          </button>
        </form>

        <p className="privacy-note form-status" data-state={status} aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}
