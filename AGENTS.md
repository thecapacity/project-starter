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
├── public/
│   └── index.html        ← Static site served by CF Assets
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

Migration files live in `migrations/` and are named `0001_init.sql`, `0002_*.sql`, etc.

```bash
# Create database (one-time)
wrangler d1 create <db-name>

# Apply migrations
wrangler d1 migrations apply <db-name> --local
wrangler d1 migrations apply <db-name> --remote

# Run ad-hoc queries
wrangler d1 execute <db-name> --local --command="SELECT * FROM table"
```

Don't forget to add the D1 binding to `wrangler.jsonc` after creating the database.
