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
/** Returns a shallow copy of current logger options. */
function GetUserOptions() {
    return { ...options };
}
/**
 * Creates a scoped logger that auto-injects service/method/correlationId/tags context
 * into every log entry. Call `.child(context)` to derive a narrower scope.
 *
 * @example
 * const log = createLogger({ serviceName: "payments", correlationId: req.id });
 * log.info("charge initiated", { meta: { amount: 99 } });
 *
 * const methodLog = log.child({ methodName: "chargeCard" });
 * methodLog.error("card declined", new Error("insufficient funds"), "network");
 */
function createLogger(context = {}) {
    function mergeContext(payload) {
        return {
            ...payload,
            serviceName: payload.serviceName ?? context.serviceName,
            methodName: payload.methodName ?? context.methodName,
            correlationId: payload.correlationId ?? context.correlationId,
            tags: payload.tags ?? context.tags
        };
    }
    return {
        debug: (message, extra) => (0, logger_1.logger)(options, "Debug", mergeContext({ message, ...extra })),
        trace: (message, extra) => (0, logger_1.logger)(options, "Trace", mergeContext({ message, ...extra })),
        info: (message, extra) => (0, logger_1.logger)(options, "Info", mergeContext({ message, ...extra })),
        warn: (message, extra) => (0, logger_1.logger)(options, "Warn", mergeContext({ message, ...extra })),
        error: (message, errorObj, errorType = "other", meta) => (0, logger_1.logger)(options, "Error", mergeContext({ message, errorObj, errorType, meta })),
        fatal: (message, errorObj, errorType = "other", meta) => (0, logger_1.logger)(options, "Fatal", mergeContext({ message, errorObj, errorType, meta })),
        success: (message, extra) => (0, logger_1.logger)(options, "Success", mergeContext({ message, ...extra })),
        /** Returns a new logger inheriting this context, with overrides applied. */
        child: (childContext) => createLogger({ ...context, ...childContext })
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