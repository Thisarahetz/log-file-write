import { TErrorType, TLogLevel } from "./type";
export declare function generateSlackMessageBlocks(errorType: TErrorType, errorMessage: string, logLevel: TLogLevel): Record<string, unknown>[];
