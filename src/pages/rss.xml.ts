import type { APIRoute } from "astro";
import { getPosts } from "../data/blog";
import { profile } from "../data/profile";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("http://localhost:4321");
  const posts = (await getPosts()).filter((p) => !p.data.draft);
  const items = posts
    .map((p) => {
      const url = new URL(`/blog/${p.id}/`, base).href;
      return `<item><title>${esc(p.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><category>${esc(p.data.kind)}</category><description>${esc(p.data.description)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(profile.name)}: writing</title><link>${new URL("/blog/", base).href}</link><description>Open source, theory and build logs on edge AI and robotics.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
};
