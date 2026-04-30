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
function isSuppressed(logLevel, configuredLevel) {
    const level = logLevel.toLowerCase();
    return ((configuredLevel === "prod" && (level === "debug" || level === "trace")) ||
        (configuredLevel === "prod-trace" && level === "debug"));
}
function buildErrorLine(options, logLevel, payload) {
    const time = (0, dayjs_1.default)().tz(options.timeZone).format(options.timeFormat);
    const date = (0, dayjs_1.default)().tz(options.timeZone).format(options.dateFormat);
    const currentTime = options.dateBasedFileNaming ? time : `${date} ${time}`;
    return [
        currentTime,
        logLevel,
        (0, common_1.sanitizeField)(payload.message),
        payload.serviceName ? `Service: ${(0, common_1.sanitizeField)(payload.serviceName)}` : "",
        payload.methodName ? `Method: ${(0, common_1.sanitizeField)(payload.methodName)}` : "",
        payload.errorObj ? `Meta: ${(0, common_1.sanitizeField)(payload.errorObj)}` : ""
    ]
        .filter(Boolean)
        .join(" | ");
}
async function postToSlack(webhookUrl, errorType, errorLine, logLevel) {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
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
    if (!retention || !options.dateBasedFileNaming) {
        return;
    }
    const cutOff = (0, dayjs_1.default)().tz(options.timeZone).subtract(retention, "day");
    const files = await (0, promises_1.readdir)(options.folderPath);
    const deletions = files.map(async (file) => {
        if (!file.endsWith(options.fileNameExtension)) {
            return;
        }
        const withoutExtension = file.slice(0, -options.fileNameExtension.length);
        const dateToken = withoutExtension
            .replace(options.fileNamePrefix, "")
            .replace(options.fileNameSuffix, "");
        const parsedDate = dayjs_1.default.tz(dateToken, options.dateFormat, options.timeZone);
        if (!parsedDate.isValid() || !parsedDate.isBefore(cutOff)) {
            return;
        }
        await (0, promises_1.unlink)(node_path_1.default.join(options.folderPath, file));
    });
    await Promise.allSettled(deletions);
}
async function logger(options, logLevel, payload, callback) {
    try {
        if (isSuppressed(logLevel, options.logLevel)) {
            callback?.(null);
            return;
        }
        await (0, promises_1.mkdir)(options.folderPath, { recursive: true });
        const fileName = options.dateBasedFileNaming ? (0, common_1.GetCurrentDateFileName)(options) : (0, common_1.GetLogFileName)(options);
        const errorLine = buildErrorLine(options, logLevel, payload);
        if (!options.onlyFileLogging) {
            // Keep console output optional without exposing raw object/newline injection.
            console.log(errorLine);
        }
        if (options.slackWebhookUrl) {
            try {
                await postToSlack(options.slackWebhookUrl, payload.errorType ?? "other", errorLine, logLevel);
            }
            catch (error) {
                console.error("Slack log submission failed:", error instanceof Error ? error.message : "Unknown error");
            }
        }
        await deleteOldLogs(options);
        await (0, promises_1.appendFile)(fileName, `${errorLine}\n`, { encoding: "utf8" });
        callback?.(null);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        callback?.(message);
        throw error;
    }
}
//# sourceMappingURL=logger.js.map