# Changelog

All notable changes to this project are documented in this file.

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
