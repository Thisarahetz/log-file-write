import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/logger";
import { TDefaultOptions, defaultOptions } from "../src/type";

function createOptions(folderPath: string): TDefaultOptions {
  return {
    ...defaultOptions,
    folderPath,
    dateBasedFileNaming: false,
    fileName: "test-log",
    onlyFileLogging: true,
    logsDeletePeriodInDays: 1
  };
}

describe("logger core", () => {
  const tempFolders: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(tempFolders.map((folder) => rm(folder, { recursive: true, force: true })));
    tempFolders.length = 0;
  });

  it("writes logs to file and invokes callback", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-"));
    tempFolders.push(folder);
    const options = createOptions(folder);
    const callback = vi.fn();

    await logger(
      options,
      "Info",
      { message: "hello\nworld", serviceName: "svc", methodName: "m", errorObj: { x: 1 } },
      callback
    );

    const contents = await readFile(path.join(folder, "test-log.log"), "utf8");
    expect(contents).toContain("hello world");
    expect(contents).toContain("Service: svc");
    expect(callback).toHaveBeenCalledWith(null);
  });

  it("suppresses debug logs in prod mode", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-"));
    tempFolders.push(folder);
    const callback = vi.fn();
    const options = { ...createOptions(folder), logLevel: "prod" as const };

    await logger(options, "Debug", { message: "should not write" }, callback);
    await expect(readFile(path.join(folder, "test-log.log"), "utf8")).rejects.toBeTruthy();
    expect(callback).toHaveBeenCalledWith(null);
  });

  it("handles failing slack webhook without failing file logging", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-"));
    tempFolders.push(folder);
    const options = {
      ...createOptions(folder),
      slackWebhookUrl: "https://example.test/slack"
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );

    await logger(options, "Error", { message: "failure", errorType: "server" });
    const contents = await readFile(path.join(folder, "test-log.log"), "utf8");
    expect(contents).toContain("failure");
  });

  it("deletes old date-based files based on retention", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-"));
    tempFolders.push(folder);
    const options = {
      ...createOptions(folder),
      dateBasedFileNaming: true,
      fileNamePrefix: "Logs_",
      fileNameSuffix: "_file",
      dateFormat: "YYYY-MM-DD"
    };

    await writeFile(path.join(folder, "Logs_2000-01-01_file.log"), "old");
    await logger(options, "Info", { message: "current" });

    await expect(readFile(path.join(folder, "Logs_2000-01-01_file.log"), "utf8")).rejects.toBeTruthy();
  });
});
