import { getCollection } from "astro:content";
import { marked } from "marked";

export type CueItem = { tag?: string; text: string; note?: string; sub?: CueItem[] };
export type CueDay = { date: Date; label: string; items: CueItem[] };

/** Inline Markdown → HTML; external links open in a new tab. */
export function md(text: string): string {
  const html = marked.parseInline(text, { async: false }) as string;
  return html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
}

/** All days, newest first. */
export async function getCueDays(): Promise<CueDay[]> {
  const months = await getCollection("cues");
  return months
    .flatMap((m) => m.data.days)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Tags sorted by frequency. */
export function tagCounts(days: CueDay[]) {
  const counts = new Map<string, number>();
  for (const d of days) for (const i of d.items) if (i.tag) counts.set(i.tag, (counts.get(i.tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Plain-text preview of an entry's Markdown, for cards. */
export function plain(text: string, max = 180) {
  const t = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "");
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
}

/** Stable soft colour (0–5) for a topic, so each tag keeps the same tint everywhere. */
const FIXED: Record<string, number> = { Art: 3, Music: 2, Cinema: 4, Poetry: 1, Literature: 5, Photography: 0, Architecture: 1, Politics: 2 };
export function tint(tag: string): number {
  if (tag in FIXED) return FIXED[tag];
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 6;
}
