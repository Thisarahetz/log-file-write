export type TDefaultOptions = {
    timeZone: string;
    folderPath: string;
    dateBasedFileNaming: boolean;
    fileName: string;
    fileNamePrefix: string;
    fileNameSuffix: string;
    fileNameExtension: string;
    dateFormat: string;
    timeFormat: string;
    /** Legacy suppression mode. Use `minLevel` for numeric-level filtering. */
    logLevel: "debug" | "prod" | "prod-trace";
    /** Minimum log level to emit. Levels below this are silently dropped. */
    minLevel?: TLogLevel;
    /** Output format written to file and console. "json" produces NDJSON. */
    format: "text" | "json";
    /** Apply ANSI color codes to console output (file output is never colored). */
    colorize: boolean;
    onlyFileLogging: boolean;
    slackWebhookUrl?: string | undefined;
    logsDeletePeriodInDays?: number;
};
export type TLoggerContext = {
    serviceName?: string;
    methodName?: string;
    /** Propagated through child loggers for request-level tracing. */
    correlationId?: string;
    /** Labels attached to every log entry from this context. */
    tags?: string[];
};
export type TLogPayload = {
    message: unknown;
    serviceName?: string;
    methodName?: string;
    /** Trace ID linking log entries across service boundaries. */
    correlationId?: string;
    /** Arbitrary labels for filtering and grouping. */
    tags?: string[];
    /** Structured key-value metadata included in JSON output. */
    meta?: Record<string, unknown>;
    errorObj?: unknown;
    errorType?: TErrorType;
};
export type TLogCallback = (error: string | null) => void;
export declare const defaultOptions: TDefaultOptions;
export type TLogLevel = "Debug" | "Trace" | "Info" | "Warn" | "Error" | "Fatal" | "Success" | "Other";
export type TErrorType = "database" | "network" | "server" | "client" | "other";
