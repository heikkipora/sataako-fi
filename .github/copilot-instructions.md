<!-- Copilot / AI agent guidance for contributors -->
# Copilot instructions — Sataako.fi

Purpose
- Help AI coding agents quickly understand this repo's architecture, workflows, and code patterns.

Architecture (quick)
- Server: Node/Express in [src/app.ts](src/app.ts#L1-L80). It exposes `/frames.json` and `/frame/:timestamp` and serves static files from `public/`.
- Caching & fetch: image caching, background refresh, and task-queue logic live in [src/cache.ts](src/cache.ts#L1-L200). Post-processing and FMI API calls are in `src/fmi-*` files.
- Client: React+TypeScript under [src/client](src/client/index.tsx#L1-L40). Built with webpack into `build/public` (see `webpack.*.cjs`).
- Deployment: `production-build` produces `build/`; Ansible playbook in `ansible/site.yml` syncs `build/` to the server and configures systemd (see `ansible/roles/app`).

Key workflows & commands
- Build (production): `npm run build` (runs `./production-build`).
- Start server: `npm start` (runs `node src/app.ts`). For local dev ensure `NODE_ENV` is not `production` to load dev middleware.
- Typecheck/tests: `npm run typecheck` and `npm test` (Mocha runs `test/*.ts`).
- Dev front-end (HMR): the server conditionally imports [src/dev-assets.ts](src/dev-assets.ts#L1-L80) which mounts `webpack-dev-middleware`/HMR when `NODE_ENV !== 'production'`.
- Deploy via Ansible: run `ansible-playbook -i ansible/hosts ansible/site.yml` or use `ansible/deploy.sh` from the `ansible/` folder.

Project-specific patterns & gotchas
- TypeScript at runtime: sources are TypeScript (`.ts` / `.tsx`) and the project expects the node process to execute `src/*.ts` directly in dev. If running locally fails, you may need a ts-node/ESM loader or run builds first.
- Cache directory: production uses `/var/run/sataako`, dev uses `/tmp/sataako-cache` (`src/cache.ts`). Use `NODE_ENV` to switch behavior.
- Image negotiation: server returns PNG or WEBP using `res.format` in `src/app.ts` — preserve this pattern when modifying image responses.
- Frames list: `framesList(max, publicRoot)` in `src/cache.ts` produces the JSON used by client animation; keep sorting and timestamp formats unchanged.
- Dev assets opt-in: `src/dev-assets.ts` is loaded only when present; altering dev middleware should retain HMR integration.

Important files to inspect for changes
- Server: [src/app.ts](src/app.ts#L1-L80), [src/cache.ts](src/cache.ts#L1-L200)
- FMI & image logic: [src/fmi-radar-images.ts](src/fmi-radar-images.ts#L1-L200), [src/fmi-radar-frames.ts](src/fmi-radar-frames.ts#L1-L200), [src/fmi-lightnings.ts](src/fmi-lightnings.ts#L1-L200)
- Client: [src/client/index.tsx](src/client/index.tsx#L1-L60), [src/client/map.tsx](src/client/map.tsx#L1-L200)
- Build: [webpack.dev.cjs](webpack.dev.cjs#L1-L80), [webpack.prod.cjs](webpack.prod.cjs#L1-L40)
- Deployment: [ansible/site.yml](ansible/site.yml#L1-L20), [ansible/roles/app/tasks/main.yml](ansible/roles/app/tasks/main.yml#L1-L80)

When making changes
- Update server API shape carefully — client assumes `frames.json` is an array of `{image, lightnings, timestamp}`.
- Preserve cache pruning & filename conventions (`<timestamp>.png` / `.webp`) handled in `src/cache.ts`.
- For front-end work, prefer changing `src/client/*` and run dev server with HMR via the existing middleware — avoid editing `build/` directly.

Examples
- Fetch frames JSON: `curl http://localhost:3000/frames.json`
- Fetch a frame image: `curl -H "Accept: image/webp" http://localhost:3000/frame/2025-01-05T12:00:00Z`

If anything here is unclear or you want deeper guidance (tests, CI, or local dev troubleshooting), tell me which area to expand.
