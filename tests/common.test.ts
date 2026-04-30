import { describe, expect, it } from "vitest";
import { SetOptions, ValidateOptions, sanitizeField } from "../src/common";

describe("common utilities", () => {
  it("sanitizes multiline log values", () => {
    expect(sanitizeField("line1\nline2\r\nline3")).toBe("line1 line2 line3");
  });

  it("normalizes extension and log level", () => {
    const options = ValidateOptions({
      fileNameExtension: "log",
      logLevel: "prod",
      folderPath: "./logs-test"
    });

    expect(options.fileNameExtension).toBe(".log");
    expect(options.logLevel).toBe("prod");
  });

  it("returns defaults when no options are provided", () => {
    const options = SetOptions();
    expect(options.folderPath).toBeTypeOf("string");
    expect(options.timeZone).toBeTypeOf("string");
  });
});
