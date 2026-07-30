import type { SiteContent } from "@/lib/content";

/**
 * Renders only when `newsletter.form_action` is set in the YAML.
 *
 * An empty form_action would produce a form that posts to the current page:
 * the visitor sees their input vanish and assumes they subscribed, and nobody
 * receives anything. Hiding the section until there is a real endpoint is the
 * only honest behaviour. Fill in form_action and the section appears.
 */
export function Newsletter({
  newsletter,
}: {
  newsletter: SiteContent["newsletter"];
}) {
  const action = newsletter.form_action?.trim();
  if (!action) return null;

  // Mailchimp's embedded forms expect the address field to be named EMAIL.
  const fieldName =
    newsletter.provider?.toLowerCase() === "mailchimp" ? "EMAIL" : "email";

  return (
    <section className="section newsletter" aria-labelledby="newsletter-title">
      <div className="container newsletter__inner">
        <p className="eyebrow">{newsletter.eyebrow}</p>
        <h2 className="section__title" id="newsletter-title">
          {newsletter.title}
        </h2>
        <p className="newsletter__description">{newsletter.description}</p>

        <form
          className="newsletter__form"
          action={action}
          method="post"
          target="_blank"
        >
          <label className="visually-hidden" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            className="newsletter__input"
            type="email"
            name={fieldName}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <button className="btn btn--primary" type="submit">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
