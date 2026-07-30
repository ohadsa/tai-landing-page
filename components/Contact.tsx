import type { SiteContent } from "@/lib/content";
import { mailto } from "@/lib/content";

/**
 * Subject-prefilled mailto: links rather than a form. There is no backend, and
 * a form with nowhere to post would swallow messages silently.
 */
export function Contact({ contact }: { contact: SiteContent["contact"] }) {
  return (
    <section className="section" id="contact" aria-labelledby="contact-title">
      <div className="container contact__inner">
        <h2 className="section__title" id="contact-title">
          {contact.title}
        </h2>
        <p className="contact__description">{contact.description}</p>

        <p className="contact__prompt">Choose a subject and your email opens:</p>

        <ul className="contact__subjects">
          {contact.subjects.map((subject) => (
            <li key={subject}>
              <a className="chip" href={mailto(contact.email, subject)}>
                {subject}
              </a>
            </li>
          ))}
        </ul>

        <p className="contact__direct">
          Or write directly:{" "}
          <a className="link" href={mailto(contact.email)}>
            {contact.email}
          </a>
        </p>
      </div>
    </section>
  );
}
