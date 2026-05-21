"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = logger;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const common_1 = require("./common");
const customizeMasg_1 = require("./customizeMasg");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
// ANSI escape codes — only used for console output, never written to files.
const ANSI_RESET = "\x1b[0m";
const LEVEL_COLOR = {
    Debug: "\x1b[36m", // cyan
    Trace: "\x1b[35m", // magenta
    Info: "\x1b[32m", // green
    Success: "\x1b[92m", // bright green
    Other: "\x1b[37m", // white
    Warn: "\x1b[33m", // yellow
    Error: "\x1b[31m", // red
    Fatal: "\x1b[41;97m" // red background, white text
};
function isSuppressed(logLevel, options) {
    const level = logLevel.toLowerCase();
    // Legacy suppression via string mode
    const legacySuppressed = (options.logLevel === "prod" && (level === "debug" || level === "trace")) ||
        (options.logLevel === "prod-trace" && level === "debug");
    if (legacySuppressed)
        return true;
    // Numeric minLevel filtering
    if (options.minLevel !== undefined) {
        return common_1.LOG_LEVEL_PRIORITY[logLevel] < common_1.LOG_LEVEL_PRIORITY[options.minLevel];
    }
    return false;
}
function buildTextLine(options, logLevel, payload) {
    const time = (0, dayjs_1.default)().tz(options.timeZone).format(options.timeFormat);
    const date = (0, dayjs_1.default)().tz(options.timeZone).format(options.dateFormat);
    const currentTime = options.dateBasedFileNaming ? time : `${date} ${time}`;
    return [
        currentTime,
        logLevel,
        (0, common_1.sanitizeField)(payload.message),
        payload.correlationId ? `CorrelationId: ${(0, common_1.sanitizeField)(payload.correlationId)}` : "",
        payload.serviceName ? `Service: ${(0, common_1.sanitizeField)(payload.serviceName)}` : "",
        payload.methodName ? `Method: ${(0, common_1.sanitizeField)(payload.methodName)}` : "",
        payload.tags?.length ? `Tags: [${payload.tags.map(common_1.sanitizeField).join(", ")}]` : "",
        payload.meta ? `Meta: ${(0, common_1.sanitizeField)(payload.meta)}` : "",
        payload.errorObj ? `Error: ${(0, common_1.sanitizeField)(payload.errorObj)}` : ""
    ]
        .filter(Boolean)
        .join(" | ");
}
function buildJsonLine(options, logLevel, payload) {
    const now = (0, dayjs_1.default)().tz(options.timeZone);
    const entry = {
        timestamp: now.toISOString(),
        level: logLevel,
        message: typeof payload.message === "string" ? payload.message : JSON.stringify(payload.message)
    };
    if (payload.correlationId)
        entry.correlationId = payload.correlationId;
    if (payload.serviceName)
        entry.service = payload.serviceName;
    if (payload.methodName)
        entry.method = payload.methodName;
    if (payload.tags?.length)
        entry.tags = payload.tags;
    if (payload.meta)
        entry.meta = payload.meta;
    if (payload.errorObj)
        entry.error = typeof payload.errorObj === "object" ? payload.errorObj : String(payload.errorObj);
    if (payload.errorType)
        entry.errorType = payload.errorType;
    return JSON.stringify(entry);
}
function buildLogLine(options, logLevel, payload) {
    return options.format === "json"
        ? buildJsonLine(options, logLevel, payload)
        : buildTextLine(options, logLevel, payload);
}
function applyColor(line, logLevel) {
    return `${LEVEL_COLOR[logLevel]}${line}${ANSI_RESET}`;
}
async function postToSlack(webhookUrl, errorType, errorLine, logLevel) {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            blocks: (0, customizeMasg_1.generateSlackMessageBlocks)(errorType, errorLine, logLevel)
        })
    });
    if (!response.ok) {
        throw new Error(`Slack webhook returned status ${response.status}`);
    }
}
async function deleteOldLogs(options) {
    const retention = options.logsDeletePeriodInDays;
    if (!retention || !options.dateBasedFileNaming)
        return;
    const cutOff = (0, dayjs_1.default)().tz(options.timeZone).subtract(retention, "day");
    const files = await (0, promises_1.readdir)(options.folderPath);
    const deletions = files.map(async (file) => {
        if (!file.endsWith(options.fileNameExtension))
            return;
        const withoutExtension = file.slice(0, -options.fileNameExtension.length);
        const dateToken = withoutExtension
            .replace(options.fileNamePrefix, "")
            .replace(options.fileNameSuffix, "");
        const parsedDate = dayjs_1.default.tz(dateToken, options.dateFormat, options.timeZone);
        if (!parsedDate.isValid() || !parsedDate.isBefore(cutOff))
            return;
        await (0, promises_1.unlink)(node_path_1.default.join(options.folderPath, file));
    });
    await Promise.allSettled(deletions);
}
async function logger(options, logLevel, payload, callback) {
    try {
        if (isSuppressed(logLevel, options)) {
            callback?.(null);
            return;
        }
        await (0, promises_1.mkdir)(options.folderPath, { recursive: true });
        const fileName = options.dateBasedFileNaming ? (0, common_1.GetCurrentDateFileName)(options) : (0, common_1.GetLogFileName)(options);
        const logLine = buildLogLine(options, logLevel, payload);
        if (!options.onlyFileLogging) {
            const consoleLine = options.colorize ? applyColor(logLine, logLevel) : logLine;
            console.log(consoleLine);
        }
        if (options.slackWebhookUrl) {
            try {
                await postToSlack(options.slackWebhookUrl, payload.errorType ?? "other", logLine, logLevel);
            }
            catch (error) {
                console.error("Slack log submission failed:", error instanceof Error ? error.message : "Unknown error");
            }
        }
        await deleteOldLogs(options);
        await (0, promises_1.appendFile)(fileName, `${logLine}\n`, { encoding: "utf8" });
        callback?.(null);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        callback?.(message);
        throw error;
    }
}
//# sourceMappingURL=logger.js.map