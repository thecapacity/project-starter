# project-starter

A GitHub template repo for Cloudflare Workers projects. Provides a flat, minimal baseline: static site (Vite) + Worker (`src/worker.js`) + vitest testing + D1 migration groundwork.

## Project Structure

```
project-starter/
├── CLAUDE.md              ← You are here
├── AGENTS.md              ← CF-specific guidance (read this too)
├── package.json           ← All scripts and devDeps here
├── vite.config.js         ← Vite build config (root: site/, outputs to _site/)
├── vitest.config.js       ← Two test environments (see Testing below)
├── wrangler.jsonc         ← CF Worker config — customize name, routes, bindings
├── wrangler.test.jsonc    ← Minimal wrangler config for tests (no assets)
├── site/                  ← All website source files
│   └── index.html         ← Vite entry point
├── _site/                  ← Vite build output → served by CF Assets (gitignored)
├── src/
│   └── worker.js          ← CF Worker fetch handler
├── migrations/            ← D1 SQL migration files
└── test/
    ├── worker.test.js     ← Worker fetch handler tests
    └── index.test.js      ← Static HTML smoke tests
```

## Key Commands

```bash
npm run dev          # wrangler dev — runs vite build first, then watches site/ for changes
npm run build        # vite build → _site/ (one-off build)
npm run preview      # vite preview — preview built _site/ without wrangler
npm run deploy       # vite build && wrangler deploy
npm test             # vitest run (both test suites)
npm run test:watch   # vitest watch mode
npm run remote       # wrangler dev --remote
npm run log          # wrangler tail
npm run update:wrangler  # update wrangler to latest
```

## Conventions

- **JavaScript only** — no TypeScript
- **Vite for static site** — source files in `site/`, builds to `_site/`, served by CF Assets
- **`site/public/`** — Vite's static dir: files here are copied to `_site/` as-is (no processing)
- **Flat structure** — everything at repo root, no nested project dirs
- **wrangler.jsonc** — JSONC (comments allowed). Customize `name`, `routes`, and add bindings per project

## Testing

Two test environments in `vitest.config.js`:

1. **Worker tests** (`test/worker.test.js`) — run in CF Workers runtime via `@cloudflare/vitest-pool-workers`. Uses `SELF.fetch()` from `cloudflare:test`.
2. **HTML tests** (`test/index.test.js`) — run in Node. Simple file-read smoke tests.

## D1 Migrations

Migration files live in `migrations/`. Each migration can have an optional paired down file:
```
migrations/0001_init.sql        ← forward migration
migrations/0001_init.down.sql   ← rollback (optional but recommended)
```

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Create the D1 database (one-time; copy the output ID into wrangler.jsonc) |
| `npm run db:upgrade` | Apply pending migrations (local) |
| `npm run db:upgrade:remote` | Apply pending migrations (remote) |
| `npm run db:rollback` | Roll back last migration (local; requires .down.sql) |
| `npm run db:rollback:remote` | Roll back last migration (remote) |
| `npm run db:dump` | Export DB to backup.sql (local) |
| `npm run db:dump:remote` | Export DB to backup.sql (remote) |
| `npm run db:load` | Import backup.sql (local) |
| `npm run db:load:remote` | Import backup.sql (remote) |

Rollback is implemented in `scripts/db-rollback.js`. It queries `d1_migrations` for the last applied migration, applies the matching `.down.sql`, and removes the record.

The DB name defaults to `"project-starter"` — override with `DB_NAME=<name> npm run db:rollback`.

Add the D1 binding to `wrangler.jsonc` — see the commented-out example in that file.

## wrangler.jsonc — Per-Project Customization

When using this as a template, update:
- `"name"` — your worker name
- `"routes"` — your domain/pattern (or remove for workers.dev)
- Add bindings: D1, KV, R2, etc. (commented examples in the file)

See AGENTS.md for more CF-specific guidance and doc links.
