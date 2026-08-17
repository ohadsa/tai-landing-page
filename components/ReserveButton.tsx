"use client";

/**
 * Announces which workshop the visitor wants a place on.
 *
 * The workshop cards are server-rendered and the contact form is a client
 * component further down the same page, so a DOM event is the lightest way for
 * one to tell the other. The anchor still does the scrolling: if JavaScript
 * never runs, the button remains an ordinary link to #contact.
 */
export const RESERVE_EVENT = "taiatar:reserve";

export type ReserveDetail = { workshop: string };

type ReserveButtonProps = {
  href: string;
  label: string;
  arrow: string;
  workshop: string;
};

export function ReserveButton({
  href,
  label,
  arrow,
  workshop,
}: ReserveButtonProps) {
  // Only meaningful for the in-page form. A workshop pointed at a real booking
  // system elsewhere just navigates.
  const isInPage = href.startsWith("#");

  return (
    <a
      className="button primary"
      href={href}
      onClick={() => {
        if (!isInPage) return;
        window.dispatchEvent(
          new CustomEvent<ReserveDetail>(RESERVE_EVENT, {
            detail: { workshop },
          }),
        );
      }}
    >
      <span>{label}</span>
      <span className="button-arrow" aria-hidden="true">
        {arrow}
      </span>
    </a>
  );
}
