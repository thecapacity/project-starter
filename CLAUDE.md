# project-starter

A GitHub template repo for Cloudflare Workers projects. Provides a flat, minimal baseline: static site (`public/`) + Worker (`src/worker.js`) + vitest testing + D1 migration groundwork.

## Project Structure

```
project-starter/
├── CLAUDE.md             ← You are here
├── AGENTS.md             ← CF-specific guidance (read this too)
├── package.json          ← All scripts and devDeps here
├── wrangler.jsonc        ← CF Worker config — customize name, routes, bindings
├── vitest.config.js      ← Two test environments (see Testing below)
├── public/
│   └── index.html        ← Plain HTML static site, no build step
├── src/
│   └── worker.js         ← CF Worker fetch handler
├── migrations/           ← D1 SQL migration files (empty by default)
│   └── .gitkeep
└── test/
    ├── worker.test.js    ← Worker fetch handler tests
    └── index.test.js     ← Static HTML smoke tests
```

## Key Commands

```bash
npm run dev          # wrangler dev (local)
npm run deploy       # wrangler deploy
npm test             # vitest run (both test suites)
npm run test:watch   # vitest watch mode
npm run remote       # wrangler dev --remote
npm run log          # wrangler tail
npm run update:wrangler  # update wrangler to latest
```

## Conventions

- **JavaScript only** — no TypeScript
- **No build tool** — `public/index.html` is plain HTML; add Vite per-project if needed
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
