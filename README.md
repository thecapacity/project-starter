# project-starter

A GitHub template repo for Cloudflare Workers projects. Provides a minimal baseline: static site + Worker + vitest testing + D1 migration groundwork.

We use `project-starter` as the worker name but you should change this and also if you use environments to deploy then you may need to name them; e.g. wrangler will append `-<env>` name to the worker name but if you want versions to all use the same worker / app then you shoudl overwrite this setting. 

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

We'll also use `project-starter` as the worker name but you should change this and also if you use environments to deploy then you may need to name them; e.g. wrangler will append `-<env>` name to the worker name but if you want versions to all use the same worker / app then you shoudl overwrite this setting.

```bash
# Create the D1 database and apply the initial schema
wrangler d1 create project-starter
wrangler d1 migrations apply project-starter --remote
npx wrangler d1 execute project-starter --local --file="./migrations/0001_init.sql"
npx wrangler d1 execute project-starter --local --command="DROP table TEST"
npx wrangler d1 execute project-starter --remote --file="./migrations/0002_init.sql"
npx wrangler d1 execute project-starter --remote --command="SELECT * from TEST"

# Test the database exists, --local can be swapped with --remote
 npx wrangler d1 execute project-starter --local --command="SELECT * from TEST"

# Dump data to CSV
wrangler d1 execute project-starter --remote \
  --command "SELECT * FROM TEST" \
  --output csv > TEST_dump.csv
```

## Binding

Don't forget to bind the database in your `wrangler.jsonc` file, something like:

```
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "project-starter-DB",
         "database_id": "<uniqie-ID-for-the-database>"
       }
     ],
     ```

## Endpoints

After deploying the worker, the following endpoints are available:

- `/` will direct to the `public/index.html` (note any static assets overwrite the worker path)
- `*` anything else will redirect ot the worker handler