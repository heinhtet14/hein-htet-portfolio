import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per post in src/content/blog/. The file name is the URL: foo.md → /blog/foo/.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** open-source: a contribution I made · theory: something I learned · build-log: notes from a build */
    kind: z.enum(["open-source", "theory", "build-log"]),
    tags: z.array(z.string()).default([]),
    /** For open-source posts: where the contribution lives. */
    contribution: z
      .object({
        repo: z.string(),
        url: z.url(),
        status: z.enum(["merged", "open", "closed"]).optional(),
      })
      .optional(),
    /** Drafts show up in `npm run dev` only, never in the build. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
