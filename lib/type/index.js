"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOptions = void 0;
exports.defaultOptions = {
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
    format: "text",
    colorize: false,
    onlyFileLogging: false,
    slackWebhookUrl: "",
    logsDeletePeriodInDays: 60
};
//# sourceMappingURL=index.js.map