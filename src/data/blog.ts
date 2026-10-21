import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;
export type Kind = Post["data"]["kind"];

export const KINDS: Record<Kind, { label: string; blurb: string }> = {
  "open-source": { label: "open source", blurb: "contributions to other people's projects" },
  theory: { label: "theory", blurb: "things I learned and want to keep" },
  "build-log": { label: "build log", blurb: "notes from making things" },
};

/** Published posts, newest first. Drafts are included only in the dev server. */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection("blog", (p) => import.meta.env.DEV || !p.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const readingTime = (p: Post) => Math.max(1, Math.round((p.body ?? "").split(/\s+/).filter(Boolean).length / 220));

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
