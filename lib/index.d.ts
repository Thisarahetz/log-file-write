import { TDefaultOptions, TErrorType, TLogCallback, TLogLevel, TLogPayload, TLoggerContext } from "./type";
type LegacyArgs = [unknown, string?, string?, unknown?, TErrorType?, TLogCallback?];
export declare function SetUserOptions(option: Partial<TDefaultOptions>): TDefaultOptions;
/** Returns a shallow copy of current logger options. */
export declare function GetUserOptions(): TDefaultOptions;
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
export declare function createLogger(context?: TLoggerContext): {
    debug: (message: unknown, extra?: {
        errorObj?: unknown;
        meta?: Record<string, unknown>;
    }) => Promise<void>;
    trace: (message: unknown, extra?: {
        errorObj?: unknown;
        meta?: Record<string, unknown>;
    }) => Promise<void>;
    info: (message: unknown, extra?: {
        errorObj?: unknown;
        meta?: Record<string, unknown>;
    }) => Promise<void>;
    warn: (message: unknown, extra?: {
        errorObj?: unknown;
        meta?: Record<string, unknown>;
    }) => Promise<void>;
    error: (message: unknown, errorObj?: unknown, errorType?: TErrorType, meta?: Record<string, unknown>) => Promise<void>;
    fatal: (message: unknown, errorObj?: unknown, errorType?: TErrorType, meta?: Record<string, unknown>) => Promise<void>;
    success: (message: unknown, extra?: {
        errorObj?: unknown;
        meta?: Record<string, unknown>;
    }) => Promise<void>;
    /** Returns a new logger inheriting this context, with overrides applied. */
    child: (childContext: TLoggerContext) => /*elided*/ any;
};
export declare function Debug(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Trace(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Info(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Warn(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Errors(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare const Error: typeof Errors;
export declare function Fatal(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Success(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Other(...args: LegacyArgs | [TLogPayload]): Promise<void>;
export declare function Log(logLevel: TLogLevel, ...args: LegacyArgs | [TLogPayload]): Promise<void>;
export {};
