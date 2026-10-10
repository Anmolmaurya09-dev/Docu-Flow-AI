# Docu-Flow AI

A free, local-first developer documentation and utility app. README drafts, ZIP inspection, and text utilities run in the browser. The app does not have a backend, account system, database, AI service, or analytics.

## Run locally

From the workspace root:

```sh
pnpm --filter @workspace/docu-flow run dev
```

The Replit workflow supplies the app's port and base path.

## Typecheck and build

```sh
pnpm --filter @workspace/docu-flow run typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/docu-flow run build
```

The static production output is created in `artifacts/docu-flow/dist/public/`. It can be hosted on a free static hosting plan that supports single-page app route fallback. No server-side features are required.

## Main folders and files

- `src/App.tsx` — app navigation and tool screens.
- `src/lib/docu.ts` — Markdown, README, documentation-pack, JSON, text-statistics, and `.gitignore` helpers.
- `src/lib/analyzeZip.ts` — browser-only ZIP inspection with file and size limits.
- `src/index.css` — responsive dark theme and shared UI styles.

## Privacy and limits

Project Analyzer accepts ZIP files up to 5 MB and inspects at most 100 supported files. It skips common build/dependency folders, unsupported file formats, and text files over 256 KB. It does not execute source or perform a security audit. Analyzer metadata is held in memory only while the app is open; project source is not saved in local storage.

“AI” is part of the product name only. Content generation uses local templates and does not contact an AI model.
