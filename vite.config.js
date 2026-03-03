import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "site",
  build: {
    outDir: "../_site",
    emptyOutDir: true,
    rollupOptions: {
      // List each HTML page here so Vite builds them all.
      // Each page imports the same main.js and gets the same Web Components.
      input: {
        index: resolve("site/index.html"),
        about: resolve("site/about.html"),
      },
    },
  },
});
