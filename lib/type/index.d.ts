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
    logLevel: "debug" | "prod" | "prod-trace";
    onlyFileLogging: boolean;
    slackWebhookUrl?: string | undefined;
    logsDeletePeriodInDays?: number;
};
export type TLoggerContext = {
    serviceName?: string;
    methodName?: string;
};
export type TLogPayload = {
    message: unknown;
    serviceName?: string;
    methodName?: string;
    errorObj?: unknown;
    errorType?: TErrorType;
};
export type TLogCallback = (error: string | null) => void;
export declare const defaultOptions: TDefaultOptions;
export type TLogLevel = "Debug" | "Trace" | "Info" | "Warn" | "Error" | "Fatal" | "Success" | "Other";
export type TErrorType = "database" | "network" | "server" | "client" | "other";
