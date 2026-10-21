// The terminal page: a tiny shell over the profile data the page ships as JSON (#mm-data).
import type { Project, Role, Universe, UniverseId } from "../data/profile";
import type { profile as Profile } from "../data/profile";

type Data = {
  profile: typeof Profile;
  universes: Universe[];
  roles: Role[];
  projects: Pick<Project, "slug" | "title" | "year" | "universes" | "summary" | "metric" | "stack" | "link">[];
  posts: { id: string; title: string; date: string; kind: string }[];
};
type Where = UniverseId | "all";

const data: Data = JSON.parse(document.getElementById("mm-data")!.textContent!);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const uni = (id: string) => data.universes.find((u) => u.id === id);

const out = $("#term-out");
const form = $<HTMLFormElement>("#term-form");
const input = $<HTMLInputElement>("#term-in");
const past: string[] = [];
let cursor = 0;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function print(text: string, cls = "out", html = false) {
  const p = document.createElement("p");
  p.className = `line ${cls}`;
  if (html) p.innerHTML = text;
  else p.textContent = text;
  out.append(p);
  out.scrollTop = out.scrollHeight;
  return p;
}

const pad = (s: string, n: number) => s + " ".repeat(Math.max(1, n - s.length));
const ids = () => data.universes.map((u) => u.id);
const slugs = () => data.projects.map((p) => p.slug);

const commands: Record<string, { help: string; run: (args: string) => unknown }> = {
  help: {
    help: "list commands",
    run: () => {
      for (const [name, c] of Object.entries(commands)) {
        if (c.help) print(`${pad(name, 10)}${c.help}`);
      }
      print("↑/↓ history · tab completes · / focuses this terminal");
    },
  },
  whoami: {
    help: "a short intro",
    run: () => {
      const p = data.profile;
      print(`${p.name} (${p.alias}), ${p.title}, ${p.location}`, "hi");
      print(p.summary);
    },
  },
  universes: {
    help: "the areas my work falls into",
    run: () => {
      for (const u of data.universes) {
        const n = data.projects.filter((p) => p.universes.includes(u.id)).length;
        print(`${pad(u.id, 10)}${pad(u.name, 22)}${n} projects`);
      }
      print("ls <id> lists one · warp <id> opens the work page filtered to it");
    },
  },
  warp: {
    help: "open the work page: warp <universe|all>",
    run: (arg) => {
      const id = (arg || "all") as Where;
      if (id !== "all" && !uni(id)) return print(`no such universe: ${arg}. try 'universes'`, "err");
      print(`warping to ${id === "all" ? "all work" : uni(id)!.name}…`, "hi");
      setTimeout(() => location.assign(id === "all" ? "/work/" : `/work/#u/${id}`), reduced ? 0 : 400);
    },
  },
  ls: {
    help: "list projects",
    run: (arg) => {
      const where = (arg || "all") as Where;
      if (where !== "all" && !uni(where)) return print(`no such universe: ${arg}`, "err");
      const list = data.projects.filter((p) => where === "all" || p.universes.includes(where));
      for (const p of list) print(`${pad(p.slug, 20)}${pad(p.year, 6)}${p.title}`);
      print(`open <name> for details`, "hi");
    },
  },
  open: {
    help: "one project: open <name>",
    run: (arg) => {
      const p = data.projects.find((x) => x.slug === arg);
      if (!p) return print(`not found: ${arg || "(empty)"}. try 'ls'`, "err");
      print(`${p.title}, ${p.year}${p.metric ? ` · ${p.metric}` : ""}`, "hi");
      print(p.summary);
      print(p.stack.join(" · "));
      if (p.link) print(`<a href="${esc(p.link.href)}" target="_blank" rel="noopener">${esc(p.link.label)}</a>`, "out", true);
      print(`<a href="/work/#p-${esc(p.slug)}">more on the work page →</a>`, "out", true);
    },
  },
  blog: {
    help: "latest writing",
    run: () => {
      if (!data.posts.length) return print("no posts yet. soon.", "hi");
      for (const p of data.posts.slice(0, 8))
        print(`${p.date}  ${pad(p.kind, 12)}<a href="/blog/${esc(p.id)}/">${esc(p.title)}</a>`, "out", true);
    },
  },
  contact: {
    help: "how to reach me",
    run: () => {
      const c = data.profile.contact;
      print(`email     <a href="mailto:${c.email}">${c.email}</a>`, "out", true);
      print(`phone     ${c.phone}`);
      print(`linkedin  <a href="${c.linkedin}" target="_blank" rel="noopener">${c.linkedin}</a>`, "out", true);
      print(`github    <a href="${c.github}" target="_blank" rel="noopener">${c.github}</a>`, "out", true);
    },
  },
  ask: {
    help: "ask about my work: ask <question>",
    run: async (q) => {
      if (!q) return print("usage: ask <question>", "err");
      const line = print("thinking…", "hi");
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: q }),
        });
        const body = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
        line.remove();
        if (!res.ok || !body.answer) return print(body.error ?? `ask failed (${res.status})`, "err");
        await typeOut(body.answer);
      } catch {
        line.remove();
        print("ask is unreachable right now. try 'contact' instead.", "err");
      }
    },
  },
  clear: { help: "clear the screen", run: () => void (out.innerHTML = "") },
  date: { help: "", run: () => print(new Date().toString()) },
  echo: { help: "", run: (a) => print(a) },
  sudo: { help: "", run: () => print("nice try.", "err") },
};

async function typeOut(text: string) {
  const p = print("", "out");
  if (reduced) return void (p.textContent = text);
  for (let i = 0; i < text.length; i += 3) {
    p.textContent = text.slice(0, i + 3);
    out.scrollTop = out.scrollHeight;
    await new Promise((r) => setTimeout(r, 8));
  }
}

async function run(raw: string) {
  const line = raw.trim();
  print(`<span class="hi">~ $</span> ${esc(line)}`, "cmd", true);
  if (!line) return;
  past.push(line);
  cursor = past.length;
  const [name, ...rest] = line.split(/\s+/);
  const cmd = commands[name.toLowerCase()];
  if (!cmd) return print(`command not found: ${name}. type 'help'`, "err");
  input.disabled = true;
  try {
    await cmd.run(rest.join(" "));
  } finally {
    input.disabled = false;
    input.focus({ preventScroll: true });
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = input.value;
  input.value = "";
  void run(v);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" && cursor > 0) {
    input.value = past[--cursor];
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    cursor = Math.min(past.length, cursor + 1);
    input.value = past[cursor] ?? "";
    e.preventDefault();
  } else if (e.key === "Tab") {
    e.preventDefault();
    const [name, arg] = input.value.split(/\s+/, 2);
    const pool = arg === undefined ? Object.keys(commands) : name === "warp" || name === "ls" ? ["all", ...ids()] : name === "open" ? slugs() : [];
    const stem = arg ?? name;
    const hits = pool.filter((x) => x.startsWith(stem));
    if (hits.length === 1) input.value = arg === undefined ? `${hits[0]} ` : `${name} ${hits[0]}`;
    else if (hits.length > 1) print(hits.join("  "));
  }
});

document.querySelectorAll<HTMLButtonElement>("[data-run]").forEach((b) =>
  b.addEventListener("click", () => {
    void run(b.dataset.run!);
  }),
);

document.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement;
  if (e.key === "/" && !/INPUT|TEXTAREA/.test(t.tagName) && !t.isContentEditable) {
    e.preventDefault();
    input.focus();
  }
});

print("type 'help' to look around, or 'ask' something about my work.", "out");

