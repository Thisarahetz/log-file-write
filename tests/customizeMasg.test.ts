import { describe, expect, it } from "vitest";
import { generateSlackMessageBlocks } from "../src/customizeMasg";

describe("generateSlackMessageBlocks", () => {
  it("returns success-specific block for success level", () => {
    const blocks = generateSlackMessageBlocks("other", "All good", "Success");
    const section = blocks[0] as { text: { text: string } };
    expect(section.text.text).toContain("Success");
    expect(section.text.text).toContain("Operation completed");
    expect(section.text.text).toContain("All good");
  });

  it("maps error type into headline for error level", () => {
    const blocks = generateSlackMessageBlocks("database", "DB timeout", "Error");
    const section = blocks[0] as { text: { text: string } };
    expect(section.text.text).toContain("Database");
    expect(section.text.text).toContain("Error");
    expect(section.text.text).toContain("Failure reported");
    expect(section.text.text).toContain("DB timeout");
  });

  it("uses routine framing for info-level logs (no error wording)", () => {
    const blocks = generateSlackMessageBlocks("other", "Bootstrap completed", "Info");
    const section = blocks[0] as { text: { text: string } };
    expect(section.text.text).toContain("Info");
    expect(section.text.text).toContain("Application log");
    expect(section.text.text).not.toMatch(/failure|error just occurred|yikes/i);
    expect(section.text.text).toContain("Bootstrap completed");
  });

  it("uses warning framing for generic warn logs", () => {
    const blocks = generateSlackMessageBlocks("other", "Unhandled", "Warn");
    const section = blocks[0] as { text: { text: string } };
    expect(section.text.text).toContain("Warning");
    expect(section.text.text).toContain("Review recommended");
    expect(section.text.text).toContain("Unhandled");
  });
});
