# Changelog

All notable changes to this project are documented in this file.

## [3.1.0] - 2026-05-21

### Added
- **JSON structured logging** — set `format: "json"` to emit NDJSON entries. Each entry includes `timestamp`, `level`, `message`, and optional `service`, `method`, `correlationId`, `tags`, `meta`, `error`, `errorType`. Ideal for ELK, Datadog, and CloudWatch ingestion.
- **ANSI color console output** — set `colorize: true` to get level-colored terminal output. Colors are never written to log files.
- **Numeric log level priority** (`minLevel`) — set `minLevel: "Warn"` (or any `TLogLevel`) to suppress all entries below that severity. Exports `LOG_LEVEL_PRIORITY` map for programmatic comparisons.
- **Correlation / Trace ID** — `TLogPayload` and `TLoggerContext` now accept `correlationId?: string` for linking log entries across service boundaries.
- **Tags** — attach `tags?: string[]` to payloads or contexts for filtering and grouping.
- **Structured metadata** — attach arbitrary `meta?: Record<string, unknown>` to any log entry.
- **Child loggers** — `createLogger(context).child(childContext)` returns a new scoped logger that inherits the parent context and merges overrides.
- **Full method coverage on scoped logger** — `createLogger()` now exposes `trace`, `fatal`, and `success` in addition to the existing `debug`, `info`, `warn`, `error`.

## [2.2.1] - 2026-04-30

### Changed
- Slack notification copy is level-appropriate and neutral for routine logs (Info/Debug/Trace); removes misleading “error” phrasing and casual emoji strings.

## [3.0.0] - 2026-04-29

### Added
- New scoped API: `createLogger({ serviceName, methodName })` for cleaner contextual logs.
- `GetUserOptions()` helper for inspecting resolved runtime options.
- Vitest test suite with coverage reports.
- ESLint + Prettier configuration and CI workflow for lint/build/test/audit.
- `exports` map and improved package metadata for modern Node usage.

### Changed
- Logger internals fully modernized to async/await using `node:fs/promises`.
- Runtime stack updated to Node 20+ and TypeScript 5.
- Date/time handling migrated from `moment-timezone` to `dayjs`.
- Slack delivery migrated from `axios` to built-in `fetch`.
- Public logging API now supports both legacy positional parameters and object payloads.
- Input and option normalization hardened for safer logging.

### Removed
- Deprecated/unused dependencies (`moment`, `moment-timezone`, `axios`, `node-stringify`).
- Legacy generated config build artifacts no longer used by source.
