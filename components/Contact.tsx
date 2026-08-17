"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/content";
import { isConfiguredEndpoint, mailto, wasAccepted } from "@/lib/forms";
import { RESERVE_EVENT, type ReserveDetail } from "@/components/ReserveButton";

type Status = "idle" | "sending" | "success" | "error" | "handed-off";

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
  // Subject and message are controlled so a workshop's שמירת מקום button can
  // fill them in before the visitor arrives at the form.
  const [subject, setSubject] = useState(contact.subjects[0]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onReserve(event: Event) {
      const workshop = (event as CustomEvent<ReserveDetail>).detail?.workshop;
      if (!workshop) return;
      // Guard the select against a subject that is not one of its options,
      // which would render it blank.
      if (contact.subjects.includes(contact.reserve_subject)) {
        setSubject(contact.reserve_subject);
      }
      setMessage(contact.reserve_message.replace("{workshop}", workshop));
      setStatus("idle");
    }

    window.addEventListener(RESERVE_EVENT, onReserve);
    return () => window.removeEventListener(RESERVE_EVENT, onReserve);
  }, [contact]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!canPost) {
      const body = [
        `${contact.fields.name}: ${data.get("name") ?? ""}`,
        `${contact.fields.email}: ${data.get("email") ?? ""}`,
        `${contact.fields.phone}: ${data.get("phone") ?? ""}`,
        "",
        String(data.get("message") ?? ""),
      ].join("\n");
      window.location.href = mailto(contact.email, subject, body);
      // Say so either way. If no mail client is registered the browser ignores
      // the mailto entirely, and without this the button would look broken.
      setStatus("handed-off");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(action as string, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
        // Never follow the relay's success redirect: see wasAccepted.
        redirect: "manual",
      });
      if (!(await wasAccepted(response))) {
        throw new Error("the endpoint did not accept the submission");
      }
      form.reset();
      setSubject(contact.subjects[0]);
      setMessage("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const message_text =
    status === "success"
      ? contact.success_message
      : status === "error"
        ? contact.error_message
        : status === "handed-off"
          ? contact.mailto_opened_message
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

          <div className="field">
            <label htmlFor="contact-phone">{contact.fields.phone}</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="contact-subject">{contact.fields.subject}</label>
            <select
              id="contact-subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {contact.subjects.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label htmlFor="contact-message">{contact.fields.message}</label>
            <textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
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
            {message_text}
          </p>
        </form>
      </div>
    </section>
  );
}
