import { logger } from "./logger";
import { SetOptions, ValidateOptions } from "./common";
import {
  TDefaultOptions,
  TErrorType,
  TLogCallback,
  TLogLevel,
  TLogPayload,
  TLoggerContext,
  defaultOptions
} from "./type";

let options = defaultOptions;

type LegacyArgs = [unknown, string?, string?, unknown?, TErrorType?, TLogCallback?];

function normalizePayload(args: LegacyArgs | [TLogPayload]): { payload: TLogPayload; callback?: TLogCallback } {
  const firstArg = args[0];

  if (typeof firstArg === "object" && firstArg !== null && "message" in firstArg) {
    const payload = firstArg as TLogPayload;
    const callback = args[1] as TLogCallback | undefined;
    return { payload, callback };
  }

  const [message, serviceName, methodName, errorObj, errorType, callback] = args as LegacyArgs;
  return {
    payload: { message, serviceName, methodName, errorObj, errorType },
    callback
  };
}

async function writeLog(logLevel: TLogLevel, ...args: LegacyArgs | [TLogPayload]): Promise<void> {
  const { payload, callback } = normalizePayload(args);
  await logger(options, logLevel, payload, callback);
}

export function SetUserOptions(option: Partial<TDefaultOptions>): TDefaultOptions {
  options = ValidateOptions(option);
  return SetOptions(options);
}

/** Returns a shallow copy of current logger options. */
export function GetUserOptions(): TDefaultOptions {
  return { ...options };
}

/**
 * Creates a scoped logger that auto-injects service/method/correlationId/tags context
 * into every log entry. Call `.child(context)` to derive a narrower scope.
 *
 * @example
 * const log = createLogger({ serviceName: "payments", correlationId: req.id });
 * log.info("charge initiated", { meta: { amount: 99 } });
 *
 * const methodLog = log.child({ methodName: "chargeCard" });
 * methodLog.error("card declined", new Error("insufficient funds"), "network");
 */
export function createLogger(context: TLoggerContext = {}) {
  function mergeContext(payload: TLogPayload): TLogPayload {
    return {
      ...payload,
      serviceName:   payload.serviceName   ?? context.serviceName,
      methodName:    payload.methodName    ?? context.methodName,
      correlationId: payload.correlationId ?? context.correlationId,
      tags:          payload.tags          ?? context.tags
    };
  }

  return {
    debug: (message: unknown, extra?: { errorObj?: unknown; meta?: Record<string, unknown> }) =>
      logger(options, "Debug", mergeContext({ message, ...extra })),

    trace: (message: unknown, extra?: { errorObj?: unknown; meta?: Record<string, unknown> }) =>
      logger(options, "Trace", mergeContext({ message, ...extra })),

    info: (message: unknown, extra?: { errorObj?: unknown; meta?: Record<string, unknown> }) =>
      logger(options, "Info", mergeContext({ message, ...extra })),

    warn: (message: unknown, extra?: { errorObj?: unknown; meta?: Record<string, unknown> }) =>
      logger(options, "Warn", mergeContext({ message, ...extra })),

    error: (message: unknown, errorObj?: unknown, errorType: TErrorType = "other", meta?: Record<string, unknown>) =>
      logger(options, "Error", mergeContext({ message, errorObj, errorType, meta })),

    fatal: (message: unknown, errorObj?: unknown, errorType: TErrorType = "other", meta?: Record<string, unknown>) =>
      logger(options, "Fatal", mergeContext({ message, errorObj, errorType, meta })),

    success: (message: unknown, extra?: { errorObj?: unknown; meta?: Record<string, unknown> }) =>
      logger(options, "Success", mergeContext({ message, ...extra })),

    /** Returns a new logger inheriting this context, with overrides applied. */
    child: (childContext: TLoggerContext) => createLogger({ ...context, ...childContext })
  };
}

export async function Debug(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Debug", ...args);
}

export async function Trace(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Trace", ...args);
}

export async function Info(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Info", ...args);
}

export async function Warn(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Warn", ...args);
}

export async function Errors(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Error", ...args);
}

export const Error = Errors;

export async function Fatal(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Fatal", ...args);
}

export async function Success(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Success", ...args);
}

export async function Other(...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog("Other", ...args);
}

export async function Log(logLevel: TLogLevel, ...args: LegacyArgs | [TLogPayload]): Promise<void> {
  await writeLog(logLevel, ...args);
}
