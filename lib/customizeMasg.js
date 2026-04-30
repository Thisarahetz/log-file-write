"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlackMessageBlocks = generateSlackMessageBlocks;
const CATEGORY_LABEL = {
    database: "Database",
    network: "Network",
    server: "Server",
    client: "Client",
    other: "General"
};
function displayLevel(logLevel) {
    switch (logLevel) {
        case "Debug":
            return "Debug";
        case "Trace":
            return "Trace";
        case "Info":
            return "Info";
        case "Warn":
            return "Warning";
        case "Error":
            return "Error";
        case "Fatal":
            return "Critical";
        case "Success":
            return "Success";
        case "Other":
            return "Log";
        default:
            return String(logLevel);
    }
}
function tierFor(logLevel) {
    if (logLevel === "Warn") {
        return "warning";
    }
    if (logLevel === "Error" || logLevel === "Fatal") {
        return "severe";
    }
    return "routine";
}
function headline(logLevel, errorType) {
    const level = displayLevel(logLevel);
    const category = CATEGORY_LABEL[errorType];
    const tier = tierFor(logLevel);
    if (tier === "routine") {
        return `${level} · ${category} — Application log`;
    }
    if (tier === "warning") {
        return `${level} · ${category} — Review recommended`;
    }
    return `${level} · ${category} — Failure reported`;
}
function sectionBlock(text) {
    return {
        type: "section",
        text: {
            type: "plain_text",
            text,
            emoji: true
        }
    };
}
function generateSlackMessageBlocks(errorType, errorMessage, logLevel) {
    if (logLevel === "Success") {
        return [
            sectionBlock(`${displayLevel(logLevel)} — Operation completed\n${errorMessage}`)
        ];
    }
    return [sectionBlock(`${headline(logLevel, errorType)}\n${errorMessage}`)];
}
//# sourceMappingURL=customizeMasg.js.map