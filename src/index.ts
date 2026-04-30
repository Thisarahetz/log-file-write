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

/**
 * Returns a shallow copy of current logger options.
 */
export function GetUserOptions(): TDefaultOptions {
  return { ...options };
}

/**
 * Creates a scoped logger that auto-injects service/method context.
 */
export function createLogger(context: TLoggerContext = {}) {
  return {
    debug: (message: unknown, errorObj?: unknown) =>
      Debug({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
    info: (message: unknown, errorObj?: unknown) =>
      Info({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
    warn: (message: unknown, errorObj?: unknown) =>
      Warn({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
    error: (message: unknown, errorObj?: unknown, errorType: TErrorType = "other") =>
      Errors({ message, errorObj, errorType, serviceName: context.serviceName, methodName: context.methodName })
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
