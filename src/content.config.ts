import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// One entry: a tag, Markdown text, optional nested sub-points,
// and (later) `note: <slug>` pointing at a full article in src/content/notes.
type Cue = { tag?: string; text: string; note?: string; sub?: Cue[] };
const cue: z.ZodType<Cue> = z.lazy(() =>
  z.object({ tag: z.string().optional(), text: z.string(), note: z.string().optional(), sub: z.array(cue).optional() }),
);

// Thoughts & Cues: one YAML file per month (src/content/cues/2026-01.yaml …)
const cues = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/cues" }),
  schema: z.object({
    month: z.string(),
    days: z.array(z.object({ date: z.coerce.date(), label: z.string(), items: z.array(cue) })),
  }),
});

// Future blog: one Markdown file per article (src/content/notes/my-article.md)
const notes = defineCollection({
  loader: glob({ pattern: "[^_]*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tag: z.string(),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { cues, notes };
