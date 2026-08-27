import { describe, expect, it } from "vitest";
import { parseLlmCoverLetter } from "./coverLetterSchema.js";

describe("parseLlmCoverLetter", () => {
  it("parses a valid response", () => {
    const parsed = parseLlmCoverLetter(
      JSON.stringify({
        openingParagraph: "I am excited to apply.",
        bodyParagraph: "I built a payments service.",
        closingParagraph: "Thank you for your consideration.",
      })
    );
    expect(parsed.openingParagraph).toBe("I am excited to apply.");
    expect(parsed.bodyParagraph).toBe("I built a payments service.");
    expect(parsed.closingParagraph).toBe("Thank you for your consideration.");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseLlmCoverLetter("not json")).toThrow(/not valid JSON/);
  });

  it("throws when a required paragraph field is missing", () => {
    expect(() => parseLlmCoverLetter(JSON.stringify({ openingParagraph: "Hi" }))).toThrow();
  });

  it("throws when a paragraph field is the wrong type", () => {
    expect(() =>
      parseLlmCoverLetter(
        JSON.stringify({ openingParagraph: "Hi", bodyParagraph: 42, closingParagraph: "Bye" })
      )
    ).toThrow();
  });
});
