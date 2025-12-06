import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const actualites = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/actualites" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    publishDate: z.union([z.string(), z.date()]),
    description: z.string(),
  }),
});
export const collections = { actualites };
