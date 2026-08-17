"use client";

import { useEffect, useRef } from "react";
import type { LegalDocument } from "@/lib/content";
import { LegalDocumentBody } from "@/components/LegalDocumentBody";

const TITLE_ID = "legal-dialog-title";

/**
 * One legal document, open over the page.
 *
 * Built on the native `<dialog>` element rather than a hand-rolled overlay,
 * because the browser then provides the things such an overlay usually gets
 * wrong: focus moves into the dialog and is trapped there, the rest of the page
 * is made inert to both pointer and screen reader, Escape closes it, and it
 * paints in the top layer so no stacking context can bury it.
 *
 * Mounted only while open — a `<dialog>` with no `open` attribute is
 * display:none, so a browser too old to know the element would otherwise show
 * the whole policy inline in the footer.
 */
export function LegalDialog({
  doc,
  closeLabel,
  onClose,
}: {
  doc: LegalDocument;
  closeLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      // jsdom implements the element but neither of its methods. Reflecting
      // `open` keeps the content rendered and the tests exercising the real
      // component instead of a mock.
      dialog.setAttribute("open", "");
    }

    // Escape and the form's close button both end in a `close` event, so this
    // is the single place the parent needs to hear about.
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  // A modal dialog makes the page behind it inert, but does not stop it
  // scrolling — so a wheel gesture past the end of the policy would slide the
  // page underneath and lose the reader's place.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function close() {
    const dialog = ref.current;
    if (dialog && typeof dialog.close === "function") dialog.close();
    else onClose();
  }

  return (
    <dialog
      className="legal-dialog"
      ref={ref}
      aria-labelledby={TITLE_ID}
      // The backdrop is part of the dialog's own box, so a press that lands on
      // the element itself — rather than on the panel inside it — is a press
      // outside the content, and dismisses it.
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      {/* The panel carries the document's own direction, not the site's. These
          documents are English, and inheriting the surrounding RTL would put
          the close button in the top-left corner of left-to-right text. Keep
          this in step with the direction LegalDocumentBody sets. */}
      <div className="legal-dialog-panel" dir="ltr">
        <div className="legal-dialog-bar">
          <button
            type="button"
            className="legal-dialog-close"
            onClick={close}
            autoFocus
          >
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">{closeLabel}</span>
          </button>
        </div>

        {/* The scrolling region. tabIndex makes it focusable so that a keyboard
            user can page through a long policy with the arrow keys, which a
            plain overflow container does not allow. */}
        <div className="legal-dialog-body" tabIndex={0}>
          <LegalDocumentBody doc={doc} titleId={TITLE_ID} headingLevel="h2" />
        </div>
      </div>
    </dialog>
  );
}
