// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// Static by default; only /api/ask opts out of prerendering and runs as a function.
export default defineConfig({
  site: "https://hein-htet-portfolio-two.vercel.app",
  output: "static",
  adapter: vercel(),
  // Blog code blocks stay monochrome like the rest of the site.
  markdown: { syntaxHighlight: false },
});
