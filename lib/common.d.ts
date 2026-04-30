import { TDefaultOptions } from "./type";
export declare function sanitizeField(value: unknown): string;
export declare function ValidateOptions(options?: Partial<TDefaultOptions>): TDefaultOptions;
export declare function SetOptions(options?: Partial<TDefaultOptions>): TDefaultOptions;
export declare function GetCurrentDateFileName(options: TDefaultOptions): string;
export declare function GetLogFileName(options: TDefaultOptions): string;
