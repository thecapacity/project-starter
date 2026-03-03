# project-starter

A GitHub template repo for Cloudflare Workers projects. Provides a minimal baseline: static site + Worker + vitest testing + D1 migration groundwork.

We use `project-starter` as the worker name but you should change this and also if you use environments to deploy then you may need to name them; e.g. wrangler will append `-<env>` name to the worker name but if you want versions to all use the same worker / app then you shoudl overwrite this setting. 

One thing to flag: when adopting this template, do a find-replace of "project-starter" → your project name in both package.json and wrangler.jsonc. The DB name in scripts follows the same name as the worker.

## Additional

* `/plugin install playwright@claude-plugins-official`
* `/plugin marketplace add anthropics/claude-code` && `/plugin install frontend-design@claude-code-plugins`
* `/install-github-app`
* ` ... `


## Structure

```
project-starter/
├── CLAUDE.md             ← Claude Code instructions
├── AGENTS.md             ← CF-specific guidance for AI coding tools
├── package.json          ← Scripts and devDependencies
├── wrangler.jsonc        ← Cloudflare Worker config
├── vitest.config.js      ← Test config (CF Workers + Node environments)
├── public/
│   └── index.html        ← Static site (served by CF Assets)
├── src/
│   └── worker.js         ← CF Worker fetch handler
├── migrations/           ← D1 SQL migration files
└── test/
    ├── worker.test.js    ← Worker tests (CF Workers runtime)
    └── index.test.js     ← Static HTML smoke tests
```

## Quick Start

```bash
npm install
npm run dev      # Local development
npm test         # Run tests
npm run deploy   # Deploy to Cloudflare
```

## Commands

The following wrangler commands assume that the [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) CLI is installed and authenticated. 

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (wrangler dev) |
| `npm run deploy` | Deploy to Cloudflare |
| `npm test` | Run all tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run remote` | Dev against remote CF environment |
| `npm run log` | Tail worker logs |
| `npm run update:wrangler` | Update wrangler to latest |

## Endpoints

- `/` — serves `public/index.html` (static asset)
- `*` — any other path hits the Worker fetch handler

## D1 Database Migrations

Migration files in `migrations/` follow the pattern `0001_init.sql`, `0002_*.sql`, etc.

```bash
# Create the D1 database (one-time setup)
`wrangler d1 create project-starter`

# Apply migrations
`wrangler d1 migrations apply project-starter --local   # local dev`
`wrangler d1 migrations apply project-starter --remote  # production`

### Other D1 Commands (optional or for testing)
 `npx wrangler d1 execute project-starter --local --file="./migrations/0001_init.sql"`
 `npx wrangler d1 execute project-starter --local --command="DROP table TEST"`
 `npx wrangler d1 execute project-starter --remote --file="./migrations/0002_init.sql"`
 `npx wrangler d1 execute project-starter --remote --command="SELECT * from TEST"`

# Test the database exists, --local can be swapped with --remote
 `npx wrangler d1 execute project-starter --local --command="SELECT * from TEST"`

# Dump data to CSV or run ad-hoc queries
 ```wrangler d1 execute project-starter --remote \
  --command "SELECT * FROM TEST" \
  --output csv > TEST_dump.csv
```

Add the D1 binding to `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "project-starter-DB",
    "database_id": "<unique-ID-for-the-database>"
  }
]
```

## Using as a Template

When creating a new project from this template:

1. Update `"name"` in `wrangler.jsonc` and `package.json`
2. Update `"routes"` in `wrangler.jsonc` (or remove for workers.dev subdomain)
3. Add bindings (D1, KV, R2, etc.) to `wrangler.jsonc` as needed
4. Run `npm install` then `npm run dev`
