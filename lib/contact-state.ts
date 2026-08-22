/**
 * The contact form's result type.
 *
 * Kept out of app/actions/contact.ts deliberately: a "use server" module may
 * only export async functions, so the initial value cannot live beside the
 * action that produces the rest of them.
 */

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      reason: "validation" | "rate_limit" | "unavailable";
    };

export const initialContactState: ContactState = { status: "idle" };
