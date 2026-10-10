# Docu-Flow AI

A free, local-first browser app for generating developer documentation, inspecting project ZIP files, and using small developer utilities.

## Run & Operate

- `pnpm --filter @workspace/docu-flow run dev` — run the Docu-Flow web app
- `pnpm --filter @workspace/docu-flow run typecheck` — typecheck Docu-Flow
- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/docu-flow run build` — build the static app
- Build output: `artifacts/docu-flow/dist/public/`
- Docu-Flow requires no API server, database, authentication, or secrets.

## Stack

- pnpm workspace, React, TypeScript, Vite, Wouter
- JSZip handles in-browser ZIP inspection and ZIP export
- No runtime calls to external APIs or AI services

## Where things live

- `artifacts/docu-flow/src/App.tsx` — routes and tool interfaces
- `artifacts/docu-flow/src/lib/docu.ts` — local Markdown, README, docs-pack, JSON, text-statistics, and `.gitignore` helpers
- `artifacts/docu-flow/src/lib/analyzeZip.ts` — local project ZIP inspection
- `artifacts/docu-flow/src/index.css` — app theme and responsive styling
- `artifacts/docu-flow/README.md` — run/build/deploy notes and user-facing limits

## Architecture decisions

- Keep Docu-Flow static and client-only; do not add a backend, database, account system, analytics, or AI API without an explicit product change.
- Treat ZIP contents as untrusted text: never execute uploaded code, and do not persist project source.
- Share only the analyzer's summary metadata with Documentation Pack, in memory for the current session.
- Keep generated documentation template-based unless details come from user input or inspected project metadata; do not invent commands, features, or security findings.

## Product

- README Studio creates and edits Markdown README files.
- Project Analyzer inventories supported text files from ZIP archives locally.
- Developer Utilities validates/formats JSON, generates `.gitignore` files and changelogs, tidies Markdown, and counts text.
- Documentation Pack previews and edits four documents and downloads them individually or together.
- Privacy page explains local processing and limits.

## User preferences

- Maintain the local-first, no-upload, no-secret, no-AI-service scope from the product brief.

## Gotchas

- Project Analyzer accepts ZIPs up to 5 MB and inspects at most 100 supported files; it skips common bulky folders and text files over 256 KB.
- Manual Vite builds need `PORT` and `BASE_PATH`; use the build command above.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
