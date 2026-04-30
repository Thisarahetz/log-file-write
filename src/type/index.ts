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

export const defaultOptions: TDefaultOptions = {
  timeZone: "America/Resolute",
  folderPath: "./logs",
  dateBasedFileNaming: true,
  fileName: "Global_Logs",
  fileNamePrefix: "Logs_",
  fileNameSuffix: "_file",
  fileNameExtension: ".log",
  dateFormat: "YYYY-M-DD",
  timeFormat: "HH:mm:ss.SSS",
  logLevel: "debug",
  onlyFileLogging: false,
  slackWebhookUrl: "",
  logsDeletePeriodInDays: 60
};

export type TLogLevel =
  | "Debug"
  | "Trace"
  | "Info"
  | "Warn"
  | "Error"
  | "Fatal"
  | "Success"
  | "Other";

export type TErrorType = "database" | "network" | "server" | "client" | "other";

