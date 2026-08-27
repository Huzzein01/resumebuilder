import { describe, expect, it } from "vitest";
import { parseRichText, sanitizeRichText, stripRichText } from "@resumebuilder/shared";

describe("parseRichText", () => {
  it("returns a single plain segment for text with no markup", () => {
    expect(parseRichText("Built a full-stack app")).toEqual([{ text: "Built a full-stack app" }]);
  });

  it("marks a single bold span", () => {
    expect(parseRichText("Shipped <b>three</b> features")).toEqual([
      { text: "Shipped " },
      { text: "three", bold: true },
      { text: " features" },
    ]);
  });

  it("treats <strong> and <em> as aliases for bold/italic", () => {
    expect(parseRichText("<strong>Led</strong> the <em>redesign</em>")).toEqual([
      { text: "Led", bold: true },
      { text: " the " },
      { text: "redesign", italic: true },
    ]);
  });

  it("combines overlapping bold, italic, and underline into one segment's flags", () => {
    expect(parseRichText("<b><i><u>core</u></i></b>")).toEqual([
      { text: "core", bold: true, italic: true, underline: true },
    ]);
  });

  it("closes only the innermost matching tag, preserving still-open ancestors", () => {
    expect(parseRichText("<b>bold <i>and italic</i> still bold</b>")).toEqual([
      { text: "bold ", bold: true },
      { text: "and italic", bold: true, italic: true },
      { text: " still bold", bold: true },
    ]);
  });

  it("drops an unrecognized tag but keeps its inner text content", () => {
    expect(parseRichText("plain <script>alert(1)</script> text")).toEqual([
      { text: "plain " },
      { text: "alert(1)" },
      { text: " text" },
    ]);
  });

  it("decodes HTML entities in plain segments", () => {
    expect(parseRichText("Node.js &amp; React")).toEqual([{ text: "Node.js & React" }]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseRichText("")).toEqual([]);
  });
});

describe("sanitizeRichText", () => {
  it("strips a disallowed tag but keeps its text content", () => {
    expect(sanitizeRichText("<script>evil()</script>hello")).toBe("evil()hello");
  });

  it("re-serializes allowed formatting through the canonical tag names", () => {
    expect(sanitizeRichText("<strong>Led</strong> the <em>redesign</em>")).toBe(
      "<b>Led</b> the <i>redesign</i>"
    );
  });

  it("escapes angle brackets that came from plain (non-tag) text", () => {
    expect(sanitizeRichText("a < b")).toBe("a &lt; b");
  });
});

describe("stripRichText", () => {
  it("removes all markup, leaving plain text", () => {
    expect(stripRichText("<b>Shipped</b> <i>three</i> <u>features</u>")).toBe("Shipped three features");
  });
});
