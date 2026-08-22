import { describe, expect, it } from "vitest";
import { parseLead } from "@/lib/lead";

const SUBJECTS = ["שאלה על סדנה", "הרשמה לסדנה"];

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
  it("returns the trimmed lead when every field is valid", () => {
    expect(parseLead(form({ name: "  טל עטר  " }), SUBJECTS)).toEqual({
      name: "טל עטר",
      email: "someone@example.com",
      phone: "050-1234567",
      subject: "שאלה על סדנה",
      message: "אשמח לשמוע עוד על הסדנה הקרובה.",
    });
  });

  it("rejects a malformed email", () => {
    expect(parseLead(form({ email: "not-an-email" }), SUBJECTS)).toBeNull();
    expect(parseLead(form({ email: "a@b" }), SUBJECTS)).toBeNull();
  });

  it("rejects a subject the form never offered", () => {
    // The select only ever emits one of contact.subjects. Anything else came
    // from a script posting directly at the action.
    expect(parseLead(form({ subject: "<script>" }), SUBJECTS)).toBeNull();
  });

  it("rejects a name shorter than two characters", () => {
    expect(parseLead(form({ name: "א" }), SUBJECTS)).toBeNull();
  });

  it("rejects a message shorter than ten characters", () => {
    expect(parseLead(form({ message: "היי" }), SUBJECTS)).toBeNull();
  });

  it("rejects a message longer than five thousand characters", () => {
    expect(parseLead(form({ message: "א".repeat(5001) }), SUBJECTS)).toBeNull();
  });

  it("accepts the phone shapes Israeli visitors actually type", () => {
    for (const phone of [
      "0501234567",
      "050-123-4567",
      "+972 50 123 4567",
      "(050) 1234567",
    ]) {
      expect(parseLead(form({ phone }), SUBJECTS)?.phone).toBe(phone);
    }
  });

  it("rejects a phone that is not a phone", () => {
    expect(parseLead(form({ phone: "call me" }), SUBJECTS)).toBeNull();
  });

  it("rejects a missing field", () => {
    const data = form();
    data.delete("email");
    expect(parseLead(data, SUBJECTS)).toBeNull();
  });
});
