import { TDefaultOptions, TErrorType, TLogCallback, TLogLevel, TLogPayload, TLoggerContext } from "./type";
type LegacyArgs = [unknown, string?, string?, unknown?, TErrorType?, TLogCallback?];
export declare function SetUserOptions(option: Partial<TDefaultOptions>): TDefaultOptions;
/**
 * Returns a shallow copy of current logger options.
 */
export declare function GetUserOptions(): TDefaultOptions;
/**
 * Creates a scoped logger that auto-injects service/method context.
 */
export declare function createLogger(context?: TLoggerContext): {
    debug: (message: unknown, errorObj?: unknown) => Promise<void>;
    info: (message: unknown, errorObj?: unknown) => Promise<void>;
    warn: (message: unknown, errorObj?: unknown) => Promise<void>;
    error: (message: unknown, errorObj?: unknown, errorType?: TErrorType) => Promise<void>;
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
