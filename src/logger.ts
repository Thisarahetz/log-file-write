import { appendFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { GetCurrentDateFileName, GetLogFileName, LOG_LEVEL_PRIORITY, sanitizeField } from "./common";
import { generateSlackMessageBlocks } from "./customizeMasg";
import { TDefaultOptions, TErrorType, TLogCallback, TLogLevel, TLogPayload } from "./type";

dayjs.extend(utc);
dayjs.extend(timezone);

// ANSI escape codes — only used for console output, never written to files.
const ANSI_RESET = "\x1b[0m";
const LEVEL_COLOR: Record<TLogLevel, string> = {
  Debug:   "\x1b[36m",    // cyan
  Trace:   "\x1b[35m",    // magenta
  Info:    "\x1b[32m",    // green
  Success: "\x1b[92m",    // bright green
  Other:   "\x1b[37m",    // white
  Warn:    "\x1b[33m",    // yellow
  Error:   "\x1b[31m",    // red
  Fatal:   "\x1b[41;97m"  // red background, white text
};

function isSuppressed(logLevel: TLogLevel, options: TDefaultOptions): boolean {
  const level = logLevel.toLowerCase();

  // Legacy suppression via string mode
  const legacySuppressed =
    (options.logLevel === "prod" && (level === "debug" || level === "trace")) ||
    (options.logLevel === "prod-trace" && level === "debug");

  if (legacySuppressed) return true;

  // Numeric minLevel filtering
  if (options.minLevel !== undefined) {
    return LOG_LEVEL_PRIORITY[logLevel] < LOG_LEVEL_PRIORITY[options.minLevel];
  }

  return false;
}

function buildTextLine(options: TDefaultOptions, logLevel: TLogLevel, payload: TLogPayload): string {
  const time = dayjs().tz(options.timeZone).format(options.timeFormat);
  const date = dayjs().tz(options.timeZone).format(options.dateFormat);
  const currentTime = options.dateBasedFileNaming ? time : `${date} ${time}`;

  return [
    currentTime,
    logLevel,
    sanitizeField(payload.message),
    payload.correlationId ? `CorrelationId: ${sanitizeField(payload.correlationId)}` : "",
    payload.serviceName  ? `Service: ${sanitizeField(payload.serviceName)}` : "",
    payload.methodName   ? `Method: ${sanitizeField(payload.methodName)}` : "",
    payload.tags?.length ? `Tags: [${payload.tags.map(sanitizeField).join(", ")}]` : "",
    payload.meta         ? `Meta: ${sanitizeField(payload.meta)}` : "",
    payload.errorObj     ? `Error: ${sanitizeField(payload.errorObj)}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildJsonLine(options: TDefaultOptions, logLevel: TLogLevel, payload: TLogPayload): string {
  const now = dayjs().tz(options.timeZone);

  const entry: Record<string, unknown> = {
    timestamp: now.toISOString(),
    level: logLevel,
    message: typeof payload.message === "string" ? payload.message : JSON.stringify(payload.message)
  };

  if (payload.correlationId) entry.correlationId = payload.correlationId;
  if (payload.serviceName)   entry.service = payload.serviceName;
  if (payload.methodName)    entry.method = payload.methodName;
  if (payload.tags?.length)  entry.tags = payload.tags;
  if (payload.meta)          entry.meta = payload.meta;
  if (payload.errorObj)      entry.error = typeof payload.errorObj === "object" ? payload.errorObj : String(payload.errorObj);
  if (payload.errorType)     entry.errorType = payload.errorType;

  return JSON.stringify(entry);
}

function buildLogLine(options: TDefaultOptions, logLevel: TLogLevel, payload: TLogPayload): string {
  return options.format === "json"
    ? buildJsonLine(options, logLevel, payload)
    : buildTextLine(options, logLevel, payload);
}

function applyColor(line: string, logLevel: TLogLevel): string {
  return `${LEVEL_COLOR[logLevel]}${line}${ANSI_RESET}`;
}

async function postToSlack(webhookUrl: string, errorType: TErrorType, errorLine: string, logLevel: TLogLevel): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      blocks: generateSlackMessageBlocks(errorType, errorLine, logLevel)
    })
  });

  if (!response.ok) {
    throw new Error(`Slack webhook returned status ${response.status}`);
  }
}

async function deleteOldLogs(options: TDefaultOptions): Promise<void> {
  const retention = options.logsDeletePeriodInDays;
  if (!retention || !options.dateBasedFileNaming) return;

  const cutOff = dayjs().tz(options.timeZone).subtract(retention, "day");
  const files = await readdir(options.folderPath);

  const deletions = files.map(async (file) => {
    if (!file.endsWith(options.fileNameExtension)) return;

    const withoutExtension = file.slice(0, -options.fileNameExtension.length);
    const dateToken = withoutExtension
      .replace(options.fileNamePrefix, "")
      .replace(options.fileNameSuffix, "");

    const parsedDate = dayjs.tz(dateToken, options.dateFormat, options.timeZone);
    if (!parsedDate.isValid() || !parsedDate.isBefore(cutOff)) return;

    await unlink(path.join(options.folderPath, file));
  });

  await Promise.allSettled(deletions);
}

export async function logger(
  options: TDefaultOptions,
  logLevel: TLogLevel,
  payload: TLogPayload,
  callback?: TLogCallback
): Promise<void> {
  try {
    if (isSuppressed(logLevel, options)) {
      callback?.(null);
      return;
    }

    await mkdir(options.folderPath, { recursive: true });
    const fileName = options.dateBasedFileNaming ? GetCurrentDateFileName(options) : GetLogFileName(options);
    const logLine = buildLogLine(options, logLevel, payload);

    if (!options.onlyFileLogging) {
      const consoleLine = options.colorize ? applyColor(logLine, logLevel) : logLine;
      console.log(consoleLine);
    }

    if (options.slackWebhookUrl) {
      try {
        await postToSlack(options.slackWebhookUrl, payload.errorType ?? "other", logLine, logLevel);
      } catch (error) {
        console.error("Slack log submission failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }

    await deleteOldLogs(options);
    await appendFile(fileName, `${logLine}\n`, { encoding: "utf8" });
    callback?.(null);
  } catch (error) {
    // Logger failures must never propagate to the caller — the logger is an extension,
    // not part of the main execution path. Report to stderr so the failure is visible
    // without affecting application behaviour.
    const message = error instanceof Error ? error.message : "Unknown error";
    callback?.(message);
    process.stderr.write(`[log-file-write] logger error: ${message}\n`);
  }
}
