#!/usr/bin/env node
// Snapshot of commit activity across local repos → src/data/activity.json.
// Writes dates and counts only: no repo names, messages or paths leave this machine.
// Usage: npm run activity  (re-run whenever you want the graph refreshed, then commit the JSON)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const ROOTS = ["Magick_Mind", "Project-Step-Up", "tethlan_reinforcement", "portfolio", "hein-htet-portfolio"].map((d) =>
  join(HOME, d),
);
// Every identity you commit under; matched against author name and email.
const AUTHORS = ["Hein Htet", "jer-1404", "jeremy1411", "heinhtet14", "heinhtet.eie", "team7@generalmagick"];
const SKIP = new Set(["node_modules", ".venv", "dist", ".next", "out", "target", ".astro", ".vercel"]);

function findRepos(dir, depth = 0, found = new Set()) {
  if (depth > 4 || !existsSync(dir)) return found;
  if (existsSync(join(dir, ".git"))) found.add(dir);
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    try {
      if (statSync(p).isDirectory()) findRepos(p, depth + 1, found);
    } catch {
      /* unreadable entry */
    }
  }
  return found;
}

const repos = [...new Set(ROOTS.flatMap((r) => [...findRepos(r)]))];
const seen = new Set();
const days = {};
let used = 0;
for (const repo of repos) {
  let out = "";
  try {
    out = execFileSync(
      "git",
      ["-C", repo, "log", "--all", "--no-merges", "--format=%H %ad", "--date=short", ...AUTHORS.map((a) => `--author=${a}`)],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch {
    continue;
  }
  let any = false;
  for (const line of out.split("\n")) {
    const [hash, date] = line.split(" ");
    if (!hash || seen.has(hash)) continue;
    seen.add(hash);
    days[date] = (days[date] ?? 0) + 1;
    any = true;
  }
  if (any) used++;
}

const sorted = Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)));
const snapshot = {
  generated: new Date().toISOString().slice(0, 10),
  repos: used,
  total: seen.size,
  days: sorted,
};
writeFileSync(new URL("../src/data/activity.json", import.meta.url), JSON.stringify(snapshot, null, 0) + "\n");
console.log(`${snapshot.total} commits on ${Object.keys(sorted).length} days across ${used} repos → src/data/activity.json`);
