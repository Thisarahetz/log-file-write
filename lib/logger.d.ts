import { TDefaultOptions, TLogCallback, TLogLevel, TLogPayload } from "./type";
export declare function logger(options: TDefaultOptions, logLevel: TLogLevel, payload: TLogPayload, callback?: TLogCallback): Promise<void>;
