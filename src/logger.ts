import { appendFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { GetCurrentDateFileName, GetLogFileName, sanitizeField } from "./common";
import { generateSlackMessageBlocks } from "./customizeMasg";
import { TDefaultOptions, TErrorType, TLogCallback, TLogLevel, TLogPayload } from "./type";

dayjs.extend(utc);
dayjs.extend(timezone);

function isSuppressed(logLevel: TLogLevel, configuredLevel: TDefaultOptions["logLevel"]): boolean {
  const level = logLevel.toLowerCase();
  return (
    (configuredLevel === "prod" && (level === "debug" || level === "trace")) ||
    (configuredLevel === "prod-trace" && level === "debug")
  );
}

function buildErrorLine(options: TDefaultOptions, logLevel: TLogLevel, payload: TLogPayload): string {
  const time = dayjs().tz(options.timeZone).format(options.timeFormat);
  const date = dayjs().tz(options.timeZone).format(options.dateFormat);
  const currentTime = options.dateBasedFileNaming ? time : `${date} ${time}`;

  return [
    currentTime,
    logLevel,
    sanitizeField(payload.message),
    payload.serviceName ? `Service: ${sanitizeField(payload.serviceName)}` : "",
    payload.methodName ? `Method: ${sanitizeField(payload.methodName)}` : "",
    payload.errorObj ? `Meta: ${sanitizeField(payload.errorObj)}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

async function postToSlack(webhookUrl: string, errorType: TErrorType, errorLine: string, logLevel: TLogLevel): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
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
  if (!retention || !options.dateBasedFileNaming) {
    return;
  }

  const cutOff = dayjs().tz(options.timeZone).subtract(retention, "day");
  const files = await readdir(options.folderPath);

  const deletions = files.map(async (file) => {
    if (!file.endsWith(options.fileNameExtension)) {
      return;
    }

    const withoutExtension = file.slice(0, -options.fileNameExtension.length);
    const dateToken = withoutExtension
      .replace(options.fileNamePrefix, "")
      .replace(options.fileNameSuffix, "");

    const parsedDate = dayjs.tz(dateToken, options.dateFormat, options.timeZone);
    if (!parsedDate.isValid() || !parsedDate.isBefore(cutOff)) {
      return;
    }

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
    if (isSuppressed(logLevel, options.logLevel)) {
      callback?.(null);
      return;
    }

    await mkdir(options.folderPath, { recursive: true });
    const fileName = options.dateBasedFileNaming ? GetCurrentDateFileName(options) : GetLogFileName(options);
    const errorLine = buildErrorLine(options, logLevel, payload);

    if (!options.onlyFileLogging) {
      // Keep console output optional without exposing raw object/newline injection.
      console.log(errorLine);
    }

    if (options.slackWebhookUrl) {
      try {
        await postToSlack(options.slackWebhookUrl, payload.errorType ?? "other", errorLine, logLevel);
      } catch (error) {
        console.error("Slack log submission failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }

    await deleteOldLogs(options);
    await appendFile(fileName, `${errorLine}\n`, { encoding: "utf8" });
    callback?.(null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    callback?.(message);
    throw error;
  }
}




