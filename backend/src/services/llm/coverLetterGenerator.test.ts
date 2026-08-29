import { describe, expect, it, vi } from "vitest";
import { generateCoverLetterWithLlm } from "./coverLetterGenerator.js";
import type { LlmProvider } from "./types.js";

const VALID_JSON = JSON.stringify({
  openingParagraph: "I am excited to apply for this role.",
  bodyParagraph: "In my previous role I built a payments service handling millions of transactions.",
  closingParagraph: "I would welcome the chance to discuss further.",
});

const CONTACT = { name: "Jordan Lee", email: "jordan@example.com", phone: "", location: "", links: [] };

function mockProvider(name: string, complete: LlmProvider["complete"], configured = true): LlmProvider {
  return { name, isConfigured: () => configured, activeModel: () => `${name}-model`, complete: vi.fn(complete) };
}

describe("generateCoverLetterWithLlm", () => {
  it("returns a CoverLetterContent assembled from known fields plus the LLM's paragraphs", async () => {
    const provider = mockProvider("anthropic", async () => VALID_JSON);

    const result = await generateCoverLetterWithLlm(
      {
        contact: CONTACT,
        jobTitle: "Backend Engineer",
        companyName: "Acme",
        hiringManagerName: "Sam Rivera",
        matchedSkills: ["Node.js"],
        relevantBullets: ["Built a payments service handling millions of transactions"],
      },
      provider
    );

    expect(result.providerName).toBe("anthropic");
    expect(result.letter.contact).toEqual(CONTACT);
    expect(result.letter.jobTitle).toBe("Backend Engineer");
    expect(result.letter.companyName).toBe("Acme");
    expect(result.letter.hiringManagerName).toBe("Sam Rivera");
    expect(result.letter.openingParagraph).toBe("I am excited to apply for this role.");
  });

  it("never lets the LLM override contact/company/title/hiringManager -- only the three paragraphs come from it", async () => {
    // A provider "misbehaving" by including extra fields is still safe: the
    // schema only extracts the three paragraph fields, everything else in
    // the assembled letter comes from the caller's known data.
    const provider = mockProvider(
      "anthropic",
      async () =>
        JSON.stringify({
          ...JSON.parse(VALID_JSON),
          contact: { name: "Someone Else", email: "evil@example.com", phone: "", location: "", links: [] },
          companyName: "Not Acme",
        })
    );

    const result = await generateCoverLetterWithLlm(
      { contact: CONTACT, companyName: "Acme", matchedSkills: [], relevantBullets: [] },
      provider
    );

    expect(result.letter.contact).toEqual(CONTACT);
    expect(result.letter.companyName).toBe("Acme");
  });

  it("propagates the error when the provider returns malformed JSON", async () => {
    const broken = mockProvider("broken", async () => "not json");

    await expect(
      generateCoverLetterWithLlm({ contact: CONTACT, matchedSkills: [], relevantBullets: [] }, broken)
    ).rejects.toThrow();
  });

  it("reports the provider and model that produced the result", async () => {
    const provider = mockProvider("ollama", async () => VALID_JSON);

    const result = await generateCoverLetterWithLlm(
      { contact: CONTACT, matchedSkills: [], relevantBullets: [] },
      provider
    );

    expect(result.providerName).toBe("ollama");
    expect(result.model).toBe("ollama-model");
  });
});
