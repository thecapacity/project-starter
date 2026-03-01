import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Worker tests run in CF Workers runtime (miniflare)
      mergeConfig(
        defineWorkersConfig({
          test: {
            poolOptions: {
              workers: {
                wrangler: { configPath: "./wrangler.jsonc" },
              },
            },
          },
        }),
        { test: { include: ["test/worker.test.js"] } }
      ),
      // HTML/static tests run in Node
      {
        test: {
          include: ["test/index.test.js"],
          environment: "node",
        },
      },
    ],
  },
});
