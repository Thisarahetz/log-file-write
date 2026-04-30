"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeField = sanitizeField;
exports.ValidateOptions = ValidateOptions;
exports.SetOptions = SetOptions;
exports.GetCurrentDateFileName = GetCurrentDateFileName;
exports.GetLogFileName = GetLogFileName;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const type_1 = require("./type");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(customParseFormat_1.default);
const VALID_LOG_LEVELS = new Set(["debug", "prod", "prod-trace"]);
function isValidTimeZone(timeZone) {
    try {
        Intl.DateTimeFormat(undefined, { timeZone });
        return true;
    }
    catch {
        return false;
    }
}
function sanitizeField(value) {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    return (stringValue ?? "")
        .replace(/\r?\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function ValidateOptions(options = {}) {
    const mergedOptions = { ...type_1.defaultOptions, ...options };
    try {
        if (!node_fs_1.default.existsSync(mergedOptions.folderPath)) {
            node_fs_1.default.mkdirSync(mergedOptions.folderPath, { recursive: true });
        }
    }
    catch {
        mergedOptions.folderPath = type_1.defaultOptions.folderPath;
    }
    if (!isValidTimeZone(mergedOptions.timeZone)) {
        mergedOptions.timeZone = type_1.defaultOptions.timeZone;
    }
    if (!VALID_LOG_LEVELS.has(mergedOptions.logLevel.toLowerCase())) {
        mergedOptions.logLevel = type_1.defaultOptions.logLevel;
    }
    else {
        mergedOptions.logLevel = mergedOptions.logLevel.toLowerCase();
    }
    if (!mergedOptions.fileNameExtension.startsWith(".")) {
        mergedOptions.fileNameExtension = `.${mergedOptions.fileNameExtension}`;
    }
    if ((mergedOptions.logsDeletePeriodInDays ?? 0) < 0) {
        mergedOptions.logsDeletePeriodInDays = type_1.defaultOptions.logsDeletePeriodInDays;
    }
    return mergedOptions;
}
function SetOptions(options) {
    return ValidateOptions(options);
}
function GetCurrentDateFileName(options) {
    const fileName = `${options.fileNamePrefix}${(0, dayjs_1.default)().tz(options.timeZone).format(options.dateFormat)}${options.fileNameSuffix}${options.fileNameExtension}`;
    return node_path_1.default.join(options.folderPath, fileName);
}
function GetLogFileName(options) {
    return node_path_1.default.join(options.folderPath, `${options.fileName}${options.fileNameExtension}`);
}
//# sourceMappingURL=common.js.map