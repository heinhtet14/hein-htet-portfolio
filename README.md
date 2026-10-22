# HH://multiverse

Personal portfolio of Hein Htet: a black-and-white, monospace, datasheet-style site focused on
embedded ML, edge AI and edge LLMs. Work is filterable by "universe" (Edge AI & Embedded,
Robotics, AI Systems, Backend, DevOps, Frontend).

- **Astro**, static output, no UI framework. Pages: `/` (intro + live worlds), `/work`, `/about`, `/blog`, `/terminal`, all sharing `src/layouts/Page.astro` (header nav, contact footer). Each page loads only its own script from `src/scripts/` (`home.ts`, `work.ts`, `terminal.ts`).
- **One serverless function**, `src/pages/api/ask.ts`. The terminal's `ask` command calls it,
  and it answers questions grounded only in `src/data/profile.ts`.

## Edit content

Every fact on the page and in the `ask` grounding comes from `src/data/profile.ts`.
Add a project there and tag it with one or more universes; the portals, counts, cards and
terminal pick it up. The résumé download is `public/hein-htet-resume.pdf`.

## Run

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # astro check (needs TypeScript 6)
npm run build
```

`ask` needs `GEMINI_API_KEY` (see `.env.example`). Without it the endpoint returns 503
and the rest of the site works.

## Deploy (Vercel)

Import the repo, set `GEMINI_API_KEY` in project env vars, and deploy. Set your real
domain in `astro.config.mjs` (`site`). The rate limiter in `ask.ts` is in-memory per
instance; move it to Vercel KV or Upstash if the endpoint gets abused.

## Terminal

`help` · `whoami` · `universes` · `warp <id|all>` · `ls [id]` · `open <slug>` ·
`worldlines` · `skills` · `contact` · `resume` · `ask <question>` · `clear`.
Press `/` anywhere to focus it; ↑/↓ for history, Tab to complete.

## Live worlds

The home page's **Live** viewer (`src/scripts/world.ts`) draws a wireframe Three.js scene with
six worlds: the Jetson Nano and Rockchip RK3588 boards, the Tet Hlan humanoid, and four Magick
Mind systems drawn as simple animated glyphs with live data flow (LLM → robot beside the
SO-ARM101, real-time voice, the Mindroid agent runtime, memory + knowledge). Tabs pick a world
and the camera glides to it. The diagrams are the `HANDS`, `VOICE`, `AGENT` and `MEMORY` specs
at the top of that file. Keep them high level: this is company work, so name roles, not
internal services, protocols or vendors.
Each world's camera view and caption live in `src/data/scenes.ts`. Three.js loads only when
the viewer nears the screen, animates only while it is on screen, idle motion stops under
reduced motion, and without WebGL only the tabs and captions show. Colours come from the
page's `--fg`/`--bg`, so it follows light and dark mode.

## Blog

Posts are Markdown files in `src/content/blog/`; the file name is the URL
(`int8-quantization.md` → `/blog/int8-quantization/`). Front matter is checked against the
schema in `src/content.config.ts`:

```yaml
title: "Fixing X in Y"
description: "One sentence for the list and the RSS feed."
date: 2026-10-21
kind: open-source        # open-source · theory · build-log
tags: [onnx, edge]
contribution:            # open-source posts only
  repo: owner/project
  url: https://github.com/owner/project/pull/123
  status: merged         # merged · open · closed
draft: true              # visible in `npm run dev` only
```

`template-open-source.md` and `template-theory.md` are drafts to copy from. The home page
shows the newest three posts, `/blog/` lists them all with a kind filter, `/rss.xml` is the
feed, and the terminal's `blog` command lists them too. Restart `npm run dev` after editing
`src/content.config.ts`.

## Hover

The site stays black and white. Pointing at a link, a project or a button flips it to
inverse video, like a terminal selection. Stack logos light up in their brand colour (or one of
`--r`/`--g`/`--b` when the brand colour would vanish on black or white), and archive photos
turn to colour; those tokens sit at the top of `src/styles/global.css`.

## Activity graph

`npm run activity` scans your local repos (roots and author identities at the top of
`scripts/activity.mjs`) and writes `src/data/activity.json`: dates and commit counts only.
Re-run it and commit the JSON to refresh the graph; Vercel builds use the committed snapshot.

## Archive

`src/data/archive.ts` holds the 2017–2021 projects and photos carried over from the previous
portfolio, with that site's captions and alt text. Photos are in `public/archive`, resized to
1400px with all metadata (including GPS) stripped.

## Stack logos

Most logos come from [Simple Icons](https://simpleicons.org) (`simple-icons`, CC0) and are inlined
as SVG at build time. Tools it lacks live in `src/data/extra-logos.ts`, reduced to one colour
from these sources:

| Tool | Source |
|---|---|
| AWS | Material Design Icons `mdi:aws` (Apache-2.0) |
| gRPC | Devicon `devicon-plain:grpc` (MIT) |
| DSPy | stanfordnlp/dspy `docs/docs/static/dspy-logo.svg` |
| Hatchet | hatchet-dev/hatchet `frontend/app/public/favicon.svg` |
| Centrifugo | centrifugal/centrifugal.dev `static/img/logo.svg` |
| MuJoCo | google-deepmind/mujoco `doc/images/banner.svg` (wordmark only) |
| Foxglove | foxglove.dev `logos/foxglove-logo-light.svg` (mark only) |
| Zenoh | eclipse-zenoh/zenoh `zenoh-dragon.png` (two-tone stencil) |
| Mem0 | logos `mem0-icon` via Iconify (CC0) |
| Letta | docs.letta.com `favicon.svg` |
| Zep | getzep/zep `assets/zep-logo-icon-gradient-rgb.svg` (background removed) |
| Honcho | plastic-labs/honcho `docs/favicon.svg` (background removed) |
| LightRAG | HKUDS/LightRAG `lightrag_webui/src/assets/logo.svg` (two-tone stencil) |
| Cohere | logos `cohere-icon` via Iconify (CC0) |

Edit the groups in `src/data/stack.ts`. A name with no logo renders as a two-letter tile in
the Stack grid and as plain text in project details. Brand logos remain trademarks of their
owners and are used only to name the tools.
