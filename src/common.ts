import fs from "node:fs";
import path from "node:path";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { TDefaultOptions, defaultOptions } from "./type";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const VALID_LOG_LEVELS = new Set(["debug", "prod", "prod-trace"]);

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function sanitizeField(value: unknown): string {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  return (stringValue ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ValidateOptions(options: Partial<TDefaultOptions> = {}): TDefaultOptions {
  const mergedOptions: TDefaultOptions = { ...defaultOptions, ...options };

  try {
    if (!fs.existsSync(mergedOptions.folderPath)) {
      fs.mkdirSync(mergedOptions.folderPath, { recursive: true });
    }
  } catch {
    mergedOptions.folderPath = defaultOptions.folderPath;
  }

  if (!isValidTimeZone(mergedOptions.timeZone)) {
    mergedOptions.timeZone = defaultOptions.timeZone;
  }

  if (!VALID_LOG_LEVELS.has(mergedOptions.logLevel.toLowerCase())) {
    mergedOptions.logLevel = defaultOptions.logLevel;
  } else {
    mergedOptions.logLevel = mergedOptions.logLevel.toLowerCase() as TDefaultOptions["logLevel"];
  }

  if (!mergedOptions.fileNameExtension.startsWith(".")) {
    mergedOptions.fileNameExtension = `.${mergedOptions.fileNameExtension}`;
  }

  if ((mergedOptions.logsDeletePeriodInDays ?? 0) < 0) {
    mergedOptions.logsDeletePeriodInDays = defaultOptions.logsDeletePeriodInDays;
  }

  return mergedOptions;
}

export function SetOptions(options?: Partial<TDefaultOptions>): TDefaultOptions {
  return ValidateOptions(options);
}

export function GetCurrentDateFileName(options: TDefaultOptions): string {
  const fileName = `${options.fileNamePrefix}${dayjs().tz(options.timeZone).format(options.dateFormat)}${options.fileNameSuffix}${options.fileNameExtension}`;
  return path.join(options.folderPath, fileName);
}

export function GetLogFileName(options: TDefaultOptions): string {
  return path.join(options.folderPath, `${options.fileName}${options.fileNameExtension}`);
}



