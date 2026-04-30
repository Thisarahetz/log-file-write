# log-file-write

`log-file-write` is a Node.js logger focused on file-based logs with timezone support, optional Slack alerts, retention cleanup, and a simple developer API.

## Requirements

- Node.js `>= 20`

## Installation

```bash
npm install log-file-write
```

## Quick Start

```ts
import { SetUserOptions, Info, Error } from "log-file-write";

SetUserOptions({
  folderPath: "./logs",
  dateBasedFileNaming: true,
  logLevel: "debug",
  onlyFileLogging: true
});

await Info("Application started", "api", "bootstrap");
await Error("Database timeout", "api", "getUsers", { retry: 1 }, "database");
```

## Modern API (recommended)

```ts
import { SetUserOptions, createLogger } from "log-file-write";

SetUserOptions({
  folderPath: "./logs",
  fileName: "application",
  dateBasedFileNaming: false,
  onlyFileLogging: true
});

const userLogger = createLogger({ serviceName: "user-service", methodName: "createUser" });
await userLogger.info("Creating user", { userId: "u-1001" });
await userLogger.error("User creation failed", { code: "DB_TIMEOUT" }, "database");
```

## Slack Webhook Support

1. Create an incoming webhook in your Slack workspace.
2. Store the webhook URL in an environment variable.
3. Pass `slackWebhookUrl` via `SetUserOptions`.

```ts
import { SetUserOptions, Error } from "log-file-write";

SetUserOptions({
  folderPath: "./logs",
  onlyFileLogging: true,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
});

await Error("Database timeout", "billing-service", "createInvoice", { retry: 1 }, "database");
```

Notes:
- Slack is optional; file logging always works without it.
- If webhook delivery fails, the library logs the error and continues writing to file.
- Supported `errorType` values for Slack text customization: `database`, `network`, `server`, `client`, `other`.

## API

- `SetUserOptions(options)` sets runtime options and validates defaults.
- `GetUserOptions()` returns the resolved options.
- `createLogger(context)` creates scoped logger helpers.
- `Debug/Trace/Info/Warn/Error/Fatal/Success/Other/Log` are async logging methods.

All methods support:

1. Legacy positional arguments:
   `Info(message, serviceName?, methodName?, errorObj?, errorType?, callback?)`
2. Object payload:
   `Info({ message, serviceName, methodName, errorObj, errorType }, callback?)`

## Security Notes

- Log fields are sanitized to reduce log-injection risks from multiline input.
- Slack webhook failures are isolated and do not break local file logging.
- Invalid timezone/log-level options are normalized to safe defaults.

## Available Options

```ts
type TDefaultOptions = {
  timeZone: string;
  folderPath: string;
  dateBasedFileNaming: boolean;
  fileName: string;
  fileNamePrefix: string;
  fileNameSuffix: string;
  fileNameExtension: string;
  dateFormat: string;
  timeFormat: string;
  logLevel: "debug" | "prod" | "prod-trace";
  onlyFileLogging: boolean;
  slackWebhookUrl?: string;
  logsDeletePeriodInDays?: number;
};
```

## Development

```bash
npm install
npm run lint
npm run build
npm test
```

## Timezone Reference

- [IANA timezone list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)


