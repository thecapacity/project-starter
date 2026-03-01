# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development (wrangler dev) |
| `npm run deploy` | Deploy to Cloudflare |
| `npm test` | Run all tests |
| `npm run remote` | Dev against remote CF environment |
| `npm run log` | Tail worker logs |

## Project Structure

```
project-starter/
├── CLAUDE.md             ← Claude Code instructions
├── AGENTS.md             ← This file — broad AI tool conventions
├── package.json          ← Consolidated: wrangler + vitest devDeps
├── wrangler.jsonc        ← Cloudflare Worker config (customize per project)
├── vitest.config.js      ← Two test environments: CF Workers + Node
├── site/
│   └── index.html        ← Vite entry point (source HTML)
├── src/
│   └── worker.js         ← Worker fetch handler
├── migrations/           ← D1 SQL migration files (0001_init.sql, etc.)
└── test/
    ├── worker.test.js    ← Worker tests (CF Workers runtime via miniflare)
    └── index.test.js     ← Static HTML smoke tests (Node)
```

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## D1 Migrations

Migration files live in `migrations/`. Convention: each `.sql` file can have a paired `.down.sql` for rollback.

```
migrations/0001_init.sql        ← forward migration (applied by db:upgrade)
migrations/0001_init.down.sql   ← rollback (applied by db:rollback)
```

| Command | Purpose |
|---------|---------|
| `npm run db:init` | `wrangler d1 create project-starter` (one-time) |
| `npm run db:upgrade` | Apply pending migrations (local) |
| `npm run db:upgrade:remote` | Apply pending migrations (remote) |
| `npm run db:rollback` | Roll back last migration (local) |
| `npm run db:rollback:remote` | Roll back last migration (remote) |
| `npm run db:dump` | Export DB → backup.sql (local) |
| `npm run db:dump:remote` | Export DB → backup.sql (remote) |
| `npm run db:load` | Import backup.sql (local) |
| `npm run db:load:remote` | Import backup.sql (remote) |

Rollback is handled by `scripts/db-rollback.js` — no native D1 rollback exists.
DB name defaults to `"project-starter"`; override with `DB_NAME=<name>`.

Don't forget to add the D1 binding to `wrangler.jsonc` after creating the database.
