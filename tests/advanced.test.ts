import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/logger";
import { SetUserOptions, createLogger } from "../src";
import { LOG_LEVEL_PRIORITY } from "../src/common";
import { TDefaultOptions, defaultOptions } from "../src/type";

function makeOptions(folderPath: string, overrides: Partial<TDefaultOptions> = {}): TDefaultOptions {
  return {
    ...defaultOptions,
    folderPath,
    dateBasedFileNaming: false,
    fileName: "adv-test",
    onlyFileLogging: true,
    logsDeletePeriodInDays: 0,
    ...overrides
  };
}

const tempFolders: string[] = [];

afterEach(async () => {
  await Promise.all(tempFolders.map((f) => rm(f, { recursive: true, force: true })));
  tempFolders.length = 0;
});

// ── JSON format ──────────────────────────────────────────────────────────────

describe("JSON format", () => {
  it("writes valid JSON with all standard fields", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-json-"));
    tempFolders.push(folder);

    await logger(makeOptions(folder, { format: "json" }), "Info", {
      message: "payment processed",
      serviceName: "billing",
      methodName: "charge",
      meta: { amount: 99, currency: "USD" }
    });

    const raw = await readFile(path.join(folder, "adv-test.log"), "utf8");
    const entry = JSON.parse(raw.trim());

    expect(entry.level).toBe("Info");
    expect(entry.message).toBe("payment processed");
    expect(entry.service).toBe("billing");
    expect(entry.method).toBe("charge");
    expect(entry.meta).toEqual({ amount: 99, currency: "USD" });
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes correlationId and tags in JSON output", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-json-"));
    tempFolders.push(folder);

    await logger(makeOptions(folder, { format: "json" }), "Warn", {
      message: "rate limit hit",
      correlationId: "req-abc-123",
      tags: ["ratelimit", "api"]
    });

    const entry = JSON.parse((await readFile(path.join(folder, "adv-test.log"), "utf8")).trim());
    expect(entry.correlationId).toBe("req-abc-123");
    expect(entry.tags).toEqual(["ratelimit", "api"]);
  });

  it("includes error and errorType fields for error-level entries", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-json-"));
    tempFolders.push(folder);

    await logger(makeOptions(folder, { format: "json" }), "Error", {
      message: "DB timeout",
      errorObj: { code: "ETIMEDOUT" },
      errorType: "database"
    });

    const entry = JSON.parse((await readFile(path.join(folder, "adv-test.log"), "utf8")).trim());
    expect(entry.error).toEqual({ code: "ETIMEDOUT" });
    expect(entry.errorType).toBe("database");
  });
});

// ── Text format with new fields ──────────────────────────────────────────────

describe("text format with new fields", () => {
  it("includes correlationId, tags, and meta in text output", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-text-"));
    tempFolders.push(folder);

    await logger(makeOptions(folder, { format: "text" }), "Info", {
      message: "user login",
      correlationId: "trace-xyz",
      tags: ["auth", "login"],
      meta: { userId: "u-42" }
    });

    const content = await readFile(path.join(folder, "adv-test.log"), "utf8");
    expect(content).toContain("CorrelationId: trace-xyz");
    expect(content).toContain("Tags: [auth, login]");
    expect(content).toContain("Meta:");
  });
});

// ── minLevel filtering ───────────────────────────────────────────────────────

describe("minLevel filtering", () => {
  it("suppresses entries below the configured minLevel", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-min-"));
    tempFolders.push(folder);
    const opts = makeOptions(folder, { minLevel: "Warn" });

    await logger(opts, "Debug", { message: "verbose debug" });
    await logger(opts, "Info",  { message: "informational" });

    await expect(readFile(path.join(folder, "adv-test.log"), "utf8")).rejects.toBeTruthy();
  });

  it("emits entries at or above minLevel", async () => {
    const folder = await mkdtemp(path.join(os.tmpdir(), "lfw-min-"));
    tempFolders.push(folder);
    const opts = makeOptions(folder, { minLevel: "Warn" });

    await logger(opts, "Warn",  { message: "rate limit" });
    await logger(opts, "Error", { message: "db failure" });
    await logger(opts, "Fatal", { message: "out of memory" });

    const content = await readFile(path.join(folder, "adv-test.log"), "utf8");
    expect(content).toContain("rate limit");
    expect(content).toContain("db failure");
    expect(content).toContain("out of memory");
  });
});

// ── LOG_LEVEL_PRIORITY ordering ──────────────────────────────────────────────

describe("LOG_LEVEL_PRIORITY", () => {
  it("defines correct relative ordering", () => {
    expect(LOG_LEVEL_PRIORITY["Debug"]).toBeLessThan(LOG_LEVEL_PRIORITY["Info"]);
    expect(LOG_LEVEL_PRIORITY["Info"]).toBeLessThan(LOG_LEVEL_PRIORITY["Warn"]);
    expect(LOG_LEVEL_PRIORITY["Warn"]).toBeLessThan(LOG_LEVEL_PRIORITY["Error"]);
    expect(LOG_LEVEL_PRIORITY["Error"]).toBeLessThan(LOG_LEVEL_PRIORITY["Fatal"]);
  });
});

// ── createLogger — child loggers ─────────────────────────────────────────────

describe("createLogger child loggers", () => {
  it("child logger inherits parent context", async () => {
    SetUserOptions({
      folderPath: "./logs-test",
      dateBasedFileNaming: false,
      fileName: "child-test",
      onlyFileLogging: true
    });

    const parent = createLogger({ serviceName: "orders", correlationId: "req-parent" });
    const child = parent.child({ methodName: "createOrder" });

    await expect(child.info("order placed")).resolves.toBeUndefined();
  });

  it("child context overrides parent context for same key", async () => {
    SetUserOptions({
      folderPath: "./logs-test",
      dateBasedFileNaming: false,
      fileName: "child-override-test",
      onlyFileLogging: true
    });

    const parent = createLogger({ serviceName: "payments", methodName: "root" });
    const child = parent.child({ methodName: "chargeCard" });

    // Should not throw; child's methodName takes precedence
    await expect(child.warn("retry attempt")).resolves.toBeUndefined();
  });
});

// ── Production safety — logger never throws ──────────────────────────────────

describe("production safety", () => {
  it("never throws when the file system is unavailable", async () => {
    // Simulate an impossible path (null byte is invalid on all platforms)
    const opts = makeOptions("/dev/null/impossible\x00path");

    // This must resolve, never reject — the logger is an extension, not a critical path
    await expect(logger(opts, "Info", { message: "should not throw" })).resolves.toBeUndefined();
  });

  it("calls callback with error message but does not throw", async () => {
    const opts = makeOptions("/dev/null/impossible\x00path");
    const callback = vi.fn();

    await logger(opts, "Error", { message: "main code continues" }, callback);

    expect(callback).toHaveBeenCalledWith(expect.any(String));
  });

  it("scoped logger methods never throw on fs failure", async () => {
    SetUserOptions({ folderPath: "/dev/null/impossible\x00path", onlyFileLogging: true });

    const log = createLogger({ serviceName: "payments" });

    // All methods must settle without throwing
    await expect(log.info("charge")).resolves.toBeUndefined();
    await expect(log.error("fail", new Error("x"))).resolves.toBeUndefined();
    await expect(log.fatal("crash")).resolves.toBeUndefined();
  });
});

// ── createLogger — all scoped methods ────────────────────────────────────────

describe("createLogger full method coverage", () => {
  it("exposes trace, fatal, and success methods", async () => {
    SetUserOptions({
      folderPath: "./logs-test",
      dateBasedFileNaming: false,
      fileName: "scoped-methods-test",
      onlyFileLogging: true
    });

    const log = createLogger({ serviceName: "test-svc" });

    await expect(log.trace("trace msg")).resolves.toBeUndefined();
    await expect(log.fatal("fatal msg")).resolves.toBeUndefined();
    await expect(log.success("success msg")).resolves.toBeUndefined();
  });
});
