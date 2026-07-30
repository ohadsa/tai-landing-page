"use client";

import { useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/content";
import { isConfiguredEndpoint, mailto } from "@/lib/forms";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Posts to the configured endpoint when there is one.
 *
 * With no endpoint the form does not pretend to send: submitting opens the
 * visitor's mail client with the message pre-filled, and a note above the
 * button says so beforehand. Either way the message reaches a person.
 */
export function Contact({ contact }: { contact: SiteContent["contact"] }) {
  const action = contact.form_action?.trim();
  const canPost = isConfiguredEndpoint(action);
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!canPost) {
      const subject = String(data.get("subject") ?? "");
      const body = [
        `${contact.fields.name}: ${data.get("name") ?? ""}`,
        `${contact.fields.email}: ${data.get("email") ?? ""}`,
        "",
        String(data.get("message") ?? ""),
      ].join("\n");
      window.location.href = mailto(contact.email, subject, body);
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(action as string, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
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
      ? contact.success_message
      : status === "error"
        ? contact.error_message
        : "";

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">{contact.eyebrow}</p>
          <h2 className="section-title" id="contact-title">
            {contact.title}
          </h2>
          <p className="contact-copy">{contact.description}</p>
          <a className="contact-email" href={mailto(contact.email)}>
            {contact.email}
          </a>
        </div>

        <form className="contact-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="contact-name">{contact.fields.name}</label>
            <input id="contact-name" name="name" autoComplete="name" required />
          </div>

          <div className="field">
            <label htmlFor="contact-email">{contact.fields.email}</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="field full">
            <label htmlFor="contact-subject">{contact.fields.subject}</label>
            <select id="contact-subject" name="subject" defaultValue={contact.subjects[0]}>
              {contact.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label htmlFor="contact-message">{contact.fields.message}</label>
            <textarea id="contact-message" name="message" required />
          </div>

          {!canPost ? (
            <p className="contact-fallback-note">{contact.mailto_fallback_note}</p>
          ) : null}

          <button
            className="button contact-submit"
            type="submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? contact.sending_label : contact.fields.submit}
          </button>

          <p className="form-message" aria-live="polite">
            {message}
          </p>
        </form>
      </div>
    </section>
  );
}
