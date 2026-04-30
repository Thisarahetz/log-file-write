import { TErrorType, TLogLevel } from "./type";

const CATEGORY_LABEL: Record<TErrorType, string> = {
  database: "Database",
  network: "Network",
  server: "Server",
  client: "Client",
  other: "General"
};

function displayLevel(logLevel: TLogLevel): string {
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

type SeverityTier = "routine" | "warning" | "severe";

function tierFor(logLevel: TLogLevel): SeverityTier {
  if (logLevel === "Warn") {
    return "warning";
  }
  if (logLevel === "Error" || logLevel === "Fatal") {
    return "severe";
  }
  return "routine";
}

function headline(logLevel: TLogLevel, errorType: TErrorType): string {
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

function sectionBlock(text: string): Record<string, unknown> {
  return {
    type: "section",
    text: {
      type: "plain_text",
      text,
      emoji: true
    }
  };
}

export function generateSlackMessageBlocks(errorType: TErrorType, errorMessage: string, logLevel: TLogLevel) {
  if (logLevel === "Success") {
    return [
      sectionBlock(`${displayLevel(logLevel)} — Operation completed\n${errorMessage}`)
    ];
  }

  return [sectionBlock(`${headline(logLevel, errorType)}\n${errorMessage}`)];
}
