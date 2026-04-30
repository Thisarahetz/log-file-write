"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = void 0;
exports.SetUserOptions = SetUserOptions;
exports.GetUserOptions = GetUserOptions;
exports.createLogger = createLogger;
exports.Debug = Debug;
exports.Trace = Trace;
exports.Info = Info;
exports.Warn = Warn;
exports.Errors = Errors;
exports.Fatal = Fatal;
exports.Success = Success;
exports.Other = Other;
exports.Log = Log;
const logger_1 = require("./logger");
const common_1 = require("./common");
const type_1 = require("./type");
let options = type_1.defaultOptions;
function normalizePayload(args) {
    const firstArg = args[0];
    if (typeof firstArg === "object" && firstArg !== null && "message" in firstArg) {
        const payload = firstArg;
        const callback = args[1];
        return { payload, callback };
    }
    const [message, serviceName, methodName, errorObj, errorType, callback] = args;
    return {
        payload: { message, serviceName, methodName, errorObj, errorType },
        callback
    };
}
async function writeLog(logLevel, ...args) {
    const { payload, callback } = normalizePayload(args);
    await (0, logger_1.logger)(options, logLevel, payload, callback);
}
function SetUserOptions(option) {
    options = (0, common_1.ValidateOptions)(option);
    return (0, common_1.SetOptions)(options);
}
/**
 * Returns a shallow copy of current logger options.
 */
function GetUserOptions() {
    return { ...options };
}
/**
 * Creates a scoped logger that auto-injects service/method context.
 */
function createLogger(context = {}) {
    return {
        debug: (message, errorObj) => Debug({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
        info: (message, errorObj) => Info({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
        warn: (message, errorObj) => Warn({ message, errorObj, serviceName: context.serviceName, methodName: context.methodName }),
        error: (message, errorObj, errorType = "other") => Errors({ message, errorObj, errorType, serviceName: context.serviceName, methodName: context.methodName })
    };
}
async function Debug(...args) {
    await writeLog("Debug", ...args);
}
async function Trace(...args) {
    await writeLog("Trace", ...args);
}
async function Info(...args) {
    await writeLog("Info", ...args);
}
async function Warn(...args) {
    await writeLog("Warn", ...args);
}
async function Errors(...args) {
    await writeLog("Error", ...args);
}
exports.Error = Errors;
async function Fatal(...args) {
    await writeLog("Fatal", ...args);
}
async function Success(...args) {
    await writeLog("Success", ...args);
}
async function Other(...args) {
    await writeLog("Other", ...args);
}
async function Log(logLevel, ...args) {
    await writeLog(logLevel, ...args);
}
//# sourceMappingURL=index.js.map