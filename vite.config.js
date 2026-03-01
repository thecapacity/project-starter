import { defineConfig } from "vite";

export default defineConfig({
  root: "site",
  build: {
    outDir: "../_site",
    emptyOutDir: true,
  },
});
