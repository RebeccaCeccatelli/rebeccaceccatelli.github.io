// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://rebeccaceccatelli.github.io",
  trailingSlash: "always",
  prefetch: { prefetchAll: true },
});
