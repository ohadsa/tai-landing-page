import { describe, expect, it } from "vitest";
import { parseLead } from "@/lib/lead";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "טל עטר",
    email: "someone@example.com",
    phone: "050-1234567",
    subject: "שאלה על סדנה",
    message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("parseLead", () => {
  it("returns the trimmed lead when every field is filled", () => {
    expect(parseLead(form({ name: "  טל עטר  " }))).toEqual({
      name: "טל עטר",
      email: "someone@example.com",
      phone: "050-1234567",
      subject: "שאלה על סדנה",
      message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    });
  });

  it("accepts a very short message", () => {
    // A real visitor writing "בדיקה" or "מעוניינת" must reach the inbox. A
    // minimum length here would silently discard the lead.
    for (const message of ["בדיקה", "היי", "?", "מעוניינת"]) {
      expect(parseLead(form({ message }))?.message).toBe(message);
    }
  });

  it("accepts any shape of phone number the visitor types", () => {
    for (const phone of [
      "0501234567",
      "050-123-4567",
      "+972 50 123 4567",
      "(050) 1234567",
      "052 1234",
      "בבקשה לחזור בוואטסאפ 0501234567",
    ]) {
      expect(parseLead(form({ phone }))?.phone).toBe(phone);
    }
  });

  it("accepts a one-character name", () => {
    expect(parseLead(form({ name: "א" }))?.name).toBe("א");
  });

  it("accepts any subject the form posted", () => {
    // The select supplies these, but a page cached before the subject list
    // changed would post an old one. That is a lead, not an attack.
    expect(parseLead(form({ subject: "נושא אחר לגמרי" }))?.subject).toBe(
      "נושא אחר לגמרי",
    );
  });

  it("rejects an empty field", () => {
    for (const key of ["name", "email", "phone", "subject", "message"]) {
      expect(parseLead(form({ [key]: "" }))).toBeNull();
    }
  });

  it("rejects a field of nothing but whitespace", () => {
    expect(parseLead(form({ message: "   \n  " }))).toBeNull();
  });

  it("rejects a missing field", () => {
    const data = form();
    data.delete("email");
    expect(parseLead(data)).toBeNull();
  });

  it("rejects absurd lengths, which are a script rather than a visitor", () => {
    expect(parseLead(form({ message: "א".repeat(10_001) }))).toBeNull();
    expect(parseLead(form({ name: "א".repeat(201) }))).toBeNull();
    expect(parseLead(form({ phone: "0".repeat(51) }))).toBeNull();
  });

  it("accepts input right up to the ceiling", () => {
    expect(parseLead(form({ message: "א".repeat(10_000) }))).not.toBeNull();
  });
});
