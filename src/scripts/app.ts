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
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ALL = { name: "All", tagline: "every timeline at once." };

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const uni = (id: string) => data.universes.find((u) => u.id === id);

/* ---------------- Universes ---------------- */

let current: Where = "all";

function warp(id: Where) {
  const u = id === "all" ? ALL : uni(id);
  if (!u) return false;
  current = id;

  root.dataset.universe = id;
  $("#u-note").textContent = u.tagline.charAt(0).toLowerCase() + u.tagline.slice(1);

  document.querySelectorAll<HTMLButtonElement>("[data-warp]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.warp === id));
  });
  document.querySelectorAll<HTMLElement>(".work > li").forEach((li) => {
    const on = id === "all" || li.dataset.universes!.split(" ").includes(id);
    li.hidden = !on;
    li.classList.remove("fade");
    if (on && !reduced) {
      void li.offsetWidth;
      li.classList.add("fade");
    }
  });

  history.replaceState(null, "", id === "all" ? location.pathname : `#u/${id}`);
  return true;
}

document.querySelectorAll<HTMLButtonElement>("[data-warp]").forEach((b) =>
  b.addEventListener("click", () => warp(b.dataset.warp as Where)),
);

const fromHash = location.hash.match(/^#u\/(\w+)/)?.[1];
if (fromHash && !warp(fromHash as Where)) warp("all");

/* ---------------- Terminal ---------------- */

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
      print("warp <id> filters the work list · warp all resets it");
    },
  },
  warp: {
    help: "filter work: warp <universe|all>",
    run: (arg) => {
      const id = (arg || "all") as Where;
      if (!warp(id)) return print(`no such universe: ${arg}. try 'universes'`, "err");
      print(`now showing ${id === "all" ? "all work" : uni(id)!.name}`, "hi");
    },
  },
  ls: {
    help: "list projects",
    run: (arg) => {
      const where = (arg || current) as Where;
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
      const el = document.querySelector<HTMLDetailsElement>(`#p-${p.slug} details`);
      if (el) el.open = true;
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
    $("#terminal").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    input.focus({ preventScroll: true });
  }
});

print("type 'help' to look around, or 'ask' something about my work.", "out");

/* ---------------- Scroll world ---------------- */

const worldEl = document.getElementById("world");
const worldCanvas = document.getElementById("world-canvas") as HTMLCanvasElement | null;
if (worldEl && worldCanvas) {
  const caps = [...worldEl.querySelectorAll<HTMLLIElement>(".world-caps li")];
  const bar = $("#world-bar");
  const webgl = (() => {
    try {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  })();

  if (!webgl) {
    worldEl.classList.add("flat");
  } else {
    let world: import("./world").WorldHandle | null = null;
    let visible = false;

    const progress = () => {
      const r = worldEl.getBoundingClientRect();
      const span = worldEl.offsetHeight - innerHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    };
    const update = () => {
      const p = progress();
      world?.setProgress(p);
      bar.style.width = `${(p * 100).toFixed(2)}%`;
      for (const li of caps) li.classList.toggle("on", p >= Number(li.dataset.from) && p < Number(li.dataset.to));
    };

    // Load three.js only when the world is about to be seen; animate only while it is on screen.
    const io = new IntersectionObserver(
      async ([e]) => {
        visible = e.isIntersecting;
        if (visible && !world) {
          const { mountWorld } = await import("./world");
          world = mountWorld(worldCanvas, { reduced });
          update();
        }
        world?.setRunning(visible && !reduced);
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(worldEl);
    addEventListener("scroll", () => visible && requestAnimationFrame(update), { passive: true });
    addEventListener("resize", update);
    update();
  }
}

/* ---------------- Archive lightbox ---------------- */

const lightbox = document.getElementById("lightbox") as HTMLDialogElement | null;
if (lightbox) {
  const img = $<HTMLImageElement>("#lightbox-img");
  const cap = $("#lightbox-cap");
  document.querySelectorAll<HTMLButtonElement>("[data-photo]").forEach((b) =>
    b.addEventListener("click", () => {
      const thumb = b.querySelector("img")!;
      img.src = b.dataset.photo!;
      img.alt = thumb.alt;
      cap.textContent = b.dataset.caption ?? "";
      lightbox.showModal();
    }),
  );
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.close();
  });
}
