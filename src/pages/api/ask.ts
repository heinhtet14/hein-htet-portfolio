import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { dossier, profile } from "../../data/profile";

export const prerender = false;

const MAX_QUESTION = 400;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 12;

// Best effort per-instance limiter. Serverless instances don't share memory, so put
// a real store (Upstash, Vercel KV) here if the endpoint ever attracts abuse.
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

// Frozen so the prefix caches across visitors; the question is the only thing that varies.
const SYSTEM = `You are the terminal of ${profile.name}'s portfolio site, answering visitors' questions about him.
Answer only from the dossier below. If the dossier doesn't cover something, say so plainly and suggest emailing ${profile.contact.email}.
Never invent employers, dates, numbers, links or opinions. Speak about ${profile.name} in the third person.
Keep answers under 120 words, plain text with no markdown headings, terminal-friendly.
Politely decline requests unrelated to ${profile.name}'s work.

<dossier>
${dossier()}
</dossier>`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "ask is offline: no API key configured" }, 503);

  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return json({ error: "expected JSON body { question }" }, 400);
  }
  if (!question) return json({ error: "usage: ask <question>" }, 400);
  if (question.length > MAX_QUESTION) return json({ error: `question too long (max ${MAX_QUESTION} chars)` }, 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || clientAddress || "unknown";
  if (limited(ip)) return json({ error: "rate limit reached, try again later" }, 429);

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: question }],
    });

    if (response.stop_reason === "refusal") {
      return json({ answer: "I can't answer that one. Try asking about projects, experience or skills." });
    }
    const answer = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    return json({ answer: answer || "No answer came back. Try rephrasing." });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: "upstream is busy, try again shortly" }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: `upstream error ${err.status ?? ""}`.trim() }, 502);
    return json({ error: "ask failed" }, 500);
  }
};
