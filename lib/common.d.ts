import { TDefaultOptions, TLogLevel } from "./type";
/** Numeric priority for each log level. Higher number = higher severity. */
export declare const LOG_LEVEL_PRIORITY: Record<TLogLevel, number>;
export declare function sanitizeField(value: unknown): string;
export declare function ValidateOptions(options?: Partial<TDefaultOptions>): TDefaultOptions;
export declare function SetOptions(options?: Partial<TDefaultOptions>): TDefaultOptions;
export declare function GetCurrentDateFileName(options: TDefaultOptions): string;
export declare function GetLogFileName(options: TDefaultOptions): string;
