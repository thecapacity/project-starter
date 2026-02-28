# project-starter
Setting up a project baseline for future work

## Commands

The following wrangler commands assume that the [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) CLI is installed and authenticated.

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