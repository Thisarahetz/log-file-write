import { describe, expect, it } from "vitest";
import { SetUserOptions, createLogger } from "../src";

describe("public API", () => {
  it("creates scoped logger and writes via modern API", async () => {
    SetUserOptions({
      folderPath: "./logs-test",
      dateBasedFileNaming: false,
      fileName: "unit-test",
      onlyFileLogging: true
    });

    const log = createLogger({ serviceName: "users-service", methodName: "create" });
    await expect(log.info("created user", { id: "u-1" })).resolves.toBeUndefined();
  });
});
