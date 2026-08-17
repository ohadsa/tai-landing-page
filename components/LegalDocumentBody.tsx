import type { LegalDocument } from "@/lib/content";

/**
 * The text of one legal document, without any surrounding chrome.
 *
 * Shared by the dialog and the standalone page so the two can never drift into
 * saying different things — which for a policy is the one bug that matters.
 *
 * Deliberately free of any filesystem or content import: the dialog is a client
 * component, and anything reaching lib/content here would drag node:fs into the
 * browser bundle. It takes the document as a prop instead.
 *
 * Paragraphs are rendered as text nodes. Nothing in the YAML is ever treated as
 * markup, so policy text pasted in from a lawyer or a generator cannot inject
 * anything into the page.
 */
export function LegalDocumentBody({
  doc,
  titleId,
  headingLevel = "h1",
}: {
  doc: LegalDocument;
  /** Lets a dialog point aria-labelledby at the title. */
  titleId?: string;
  /**
   * The standalone page's title is the page's h1. Inside the dialog the page
   * already has an h1, so the document's title drops to an h2 and its sections
   * to h3 — a heading order a screen reader can still follow.
   */
  headingLevel?: "h1" | "h2";
}) {
  const Title = headingLevel;
  const SectionHeading = headingLevel === "h1" ? "h2" : "h3";

  return (
    // English content inside a right-to-left site. Marking both the language
    // and the direction here keeps punctuation and parentheses on the correct
    // side, and tells a screen reader which voice to use.
    <div className="legal-doc" lang="en" dir="ltr">
      <Title className="legal-title" id={titleId}>
        {doc.title}
      </Title>
      <p className="legal-updated">{doc.updated_label}</p>
      <p className="legal-intro">{doc.intro}</p>

      {doc.sections.map((section) => (
        <section className="legal-section" key={section.heading}>
          <SectionHeading className="legal-heading">
            {section.heading}
          </SectionHeading>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      {doc.contact ? (
        <ContactBlock contact={doc.contact} headingTag={SectionHeading} />
      ) : null}
    </div>
  );
}

/**
 * The named contact the accessibility regulations require.
 *
 * A row appears only once its value is filled in, so an unsupplied name or
 * phone number is absent rather than a label with nothing after it. A
 * description list, because a set of label/value pairs is what that element is
 * for.
 */
function ContactBlock({
  contact,
  headingTag,
}: {
  contact: NonNullable<LegalDocument["contact"]>;
  headingTag: "h2" | "h3";
}) {
  const Heading = headingTag;
  const rows = [
    { label: contact.labels.name, value: contact.name },
    { label: contact.labels.phone, value: contact.phone, isPhone: true },
    { label: contact.labels.email, value: contact.email, isEmail: true },
  ].filter((row) => row.value.trim().length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="legal-section">
      <Heading className="legal-heading">{contact.heading}</Heading>
      <dl className="legal-contact">
        {rows.map((row) => (
          <div className="legal-contact-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              {row.isEmail ? (
                <a href={`mailto:${row.value}`}>{row.value}</a>
              ) : row.isPhone ? (
                <a href={`tel:${row.value.replace(/[^+\d]/g, "")}`}>
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
