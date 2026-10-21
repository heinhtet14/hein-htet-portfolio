// Scroll-scrubbed wireframe world. The camera flies chip → humanoid → the Magick Mind systems
// (LLM → robot, voice, agent runtime, memory), then pulls out to show all of it. The system
// diagrams stay deliberately high level: company work, so no internals.
// Scroll position drives the camera; only small idle motions autoplay, and they stop under
// prefers-reduced-motion. Camera keys and captions live in src/data/world-path.ts.
import * as THREE from "three";
import { KEYS, POS, RING_BACK, portals, type V3 } from "../data/world-path";

type Mat = THREE.LineBasicMaterial | THREE.LineDashedMaterial | THREE.PointsMaterial | THREE.SpriteMaterial | THREE.MeshBasicMaterial;

export interface WorldHandle {
  setProgress(p: number): void;
  setRunning(on: boolean): void;
  dispose(): void;
}

// ---------- system diagrams (the Magick Mind scenes) ----------
// Nodes sit on a plane facing the camera; `sub` is an optional one-line role.
interface DNode {
  id: string;
  title: string;
  sub?: string[];
  at: [number, number];
  kind?: "box" | "db" | "stack";
}
interface DEdge {
  from: string;
  to: string;
  label?: string;
  via?: [number, number][];
  dashed?: boolean;
  /** packets per edge; 0 for structural links */
  flow?: number;
}
interface DFrame {
  title: string;
  from: [number, number];
  to: [number, number];
}
interface Diagram {
  heading: string;
  nodes: DNode[];
  edges: DEdge[];
  frames?: DFrame[];
}

const HANDS: Diagram = {
  heading: "LLM → robot",
  nodes: [
    { id: "in", title: "Voice / text", at: [-13, 1] },
    { id: "agent", title: "Agent", sub: ["decides what"], at: [-6, 1] },
    { id: "iface", title: "Robot interface", sub: ["one typed contract"], at: [1.5, 1] },
    { id: "robot", title: "Robot runtime", sub: ["decides how, safely"], at: [8.5, 1] },
  ],
  edges: [
    { from: "in", to: "agent", flow: 1 },
    { from: "agent", to: "iface", label: "intent", flow: 2 },
    { from: "iface", to: "robot", flow: 2 },
    { from: "robot", to: "agent", label: "events", via: [[8.5, 4], [-6, 4]], dashed: true, flow: 1 },
  ],
};

const VOICE: Diagram = {
  heading: "Real-time voice",
  nodes: [
    { id: "dev", title: "Devices", at: [-13, 1], kind: "stack" },
    { id: "listen", title: "Listen", sub: ["speech → text"], at: [-5, 1] },
    { id: "think", title: "Think", sub: ["persona + LLM"], at: [2.5, 1] },
    { id: "speak", title: "Speak", sub: ["text → speech"], at: [10, 1] },
  ],
  edges: [
    { from: "dev", to: "listen", label: "audio", flow: 2 },
    { from: "listen", to: "think", flow: 1 },
    { from: "think", to: "speak", flow: 2 },
    { from: "speak", to: "dev", label: "reply", via: [[10, -2.2], [-13, -2.2]], flow: 2 },
  ],
};

const AGENT: Diagram = {
  heading: "Mindroid agent runtime",
  nodes: [
    { id: "ctx", title: "Context", at: [-11, 1] },
    { id: "llm", title: "LLM", sub: ["streaming"], at: [-4, 1] },
    { id: "tools", title: "Tools", sub: ["skills"], at: [3, 1] },
    { id: "out", title: "Reply", at: [10, 1] },
    { id: "mem", title: "Memory", at: [-11, -3.2], kind: "db" },
  ],
  edges: [
    { from: "ctx", to: "llm", flow: 1 },
    { from: "llm", to: "tools", flow: 1 },
    { from: "tools", to: "llm", label: "loop", via: [[3, 4], [-4, 4]], flow: 1 },
    { from: "tools", to: "out", flow: 1 },
    { from: "mem", to: "ctx", dashed: true, flow: 0 },
  ],
};

const MEMORY: Diagram = {
  heading: "Memory + knowledge",
  nodes: [
    { id: "chat", title: "Conversations", at: [-9, 3.5] },
    { id: "mem", title: "Memory", sub: ["what it remembers"], at: [-1, 3.5], kind: "db" },
    { id: "docs", title: "Documents", at: [-9, -1.5], kind: "stack" },
    { id: "kb", title: "Knowledge", sub: ["what it can look up"], at: [-1, -1.5], kind: "db" },
    { id: "ctx", title: "Agent context", at: [8, 1] },
  ],
  edges: [
    { from: "chat", to: "mem", flow: 1 },
    { from: "docs", to: "kb", flow: 1 },
    { from: "mem", to: "ctx", label: "recall", flow: 1 },
    { from: "kb", to: "ctx", label: "retrieve", flow: 1 },
  ],
};

export function mountWorld(canvas: HTMLCanvasElement, opts: { reduced: boolean }): WorldHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 1500);
  scene.fog = new THREE.Fog(0x000000, 60, 520);

  // ---------- theme-aware materials ----------
  const mats: { m: Mat; alpha: number }[] = [];
  const line = (alpha = 1) => {
    const m = new THREE.LineBasicMaterial({ transparent: alpha < 1, opacity: alpha });
    mats.push({ m, alpha });
    return m;
  };
  const dashed = (alpha = 0.6) => {
    const m = new THREE.LineDashedMaterial({ dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: alpha });
    mats.push({ m, alpha });
    return m;
  };
  // Round dots: a soft disc texture, so points never read as squares up close.
  const disc = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  })();
  const dots = (size: number, alpha = 1) => {
    const m = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity: alpha,
      map: disc,
      alphaTest: 0.4,
      depthWrite: false,
    });
    mats.push({ m, alpha });
    return m;
  };
  // Node faces are filled with the page background so wires behind a box don't show through.
  const faces: THREE.MeshBasicMaterial[] = [];
  const face = () => {
    const m = new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    faces.push(m);
    return m;
  };
  function applyTheme() {
    const cs = getComputedStyle(document.documentElement);
    const fg = new THREE.Color(cs.getPropertyValue("--fg").trim() || "#000");
    const bg = new THREE.Color(cs.getPropertyValue("--bg").trim() || "#fff");
    for (const { m } of mats) m.color.copy(fg);
    for (const m of faces) m.color.copy(bg);
    (scene.fog as THREE.Fog).color.copy(bg);
  }

  const edges = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial, angle = 1) =>
    new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), mat);
  const box = (w: number, h: number, d: number, mat: THREE.LineBasicMaterial) => edges(new THREE.BoxGeometry(w, h, d), mat);
  const segs = (pts: number[], mat: THREE.LineBasicMaterial) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, mat);
    if (mat instanceof THREE.LineDashedMaterial) l.computeLineDistances();
    return l;
  };
  const points = (pts: number[], mat: THREE.PointsMaterial) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.Points(g, mat);
  };

  // White-on-transparent text tinted by the material colour, so labels follow the theme.
  // Multi-line text is "\n"-separated; returns the sprite and its world-space width.
  function label(text: string, height = 0.6, alpha = 1, weight = 500, onTop = false) {
    const lines = text.split("\n");
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = `${weight} 64px 'IBM Plex Mono', ui-monospace, monospace`;
    ctx.font = font;
    c.width = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 24;
    c.height = 88 * lines.length;
    ctx.font = font;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, 12, 46 + i * 88));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: alpha, depthWrite: false, depthTest: !onTop });
    mats.push({ m, alpha });
    const s = new THREE.Sprite(m);
    if (onTop) s.renderOrder = 10;
    const width = (height * c.width) / 88;
    s.scale.set(width, height * lines.length, 1);
    return { sprite: s, width };
  }

  // Seeded RNG so the world is identical on every load.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const tickers: ((t: number) => void)[] = [];
  const v3 = (p: V3) => new THREE.Vector3(...p);

  // ---------- diagram builder ----------
  function diagram(spec: Diagram) {
    const g = new THREE.Group();
    const T = 0.5, S = 0.32, D = 0.7; // title height, sub-line height, box depth
    const boxes = new Map<string, { x: number; y: number; w: number; h: number }>();

    for (const n of spec.nodes) {
      const sub = n.sub ?? [];
      const title = label(n.title, T, 1, 600, true);
      const subl = sub.length ? label(sub.join("\n"), S, 0.72, 500, true) : null;
      const w = Math.max(title.width, subl?.width ?? 0) + 0.7;
      const h = T + S * sub.length + 0.55;
      const [x, y] = n.at;
      boxes.set(n.id, { x, y, w, h });
      const holder = new THREE.Group();
      holder.position.set(x, y, 0);
      const fill = new THREE.Mesh(new THREE.BoxGeometry(w, h, D), face());
      holder.add(fill);
      if (n.kind === "db") {
        // silhouette only: two sides plus the rims below, no seam lines across the label
        holder.add(segs([-w / 2, -h / 2, 0, -w / 2, h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0], line()));
        for (const yy of [h / 2, -h / 2]) {
          const ring = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(
              Array.from({ length: 40 }, (_, i) => new THREE.Vector3(Math.cos((i / 40) * Math.PI * 2) * (w / 2), yy, Math.sin((i / 40) * Math.PI * 2) * D)),
            ),
            line(),
          );
          holder.add(ring);
        }
        fill.scale.set(0.98, 1, 0.5);
      } else {
        holder.add(box(w, h, D, line()));
        if (n.kind === "stack")
          for (const k of [1, 2]) {
            const back = box(w, h, D, line(0.45 - k * 0.12));
            back.position.set(k * 0.22, k * 0.22, -k * 0.3);
            holder.add(back);
          }
      }
      title.sprite.position.set(0, h / 2 - 0.28 - T / 2 + 0.05, D / 2 + 0.05);
      holder.add(title.sprite);
      if (subl) {
        subl.sprite.position.set(0, h / 2 - 0.28 - T - (S * sub.length) / 2 + 0.02, D / 2 + 0.05);
        holder.add(subl.sprite);
      }
      g.add(holder);
    }

    // anchor on a box's border, heading toward `to`
    const anchor = (id: string, toward: THREE.Vector2) => {
      const b = boxes.get(id)!;
      const c = new THREE.Vector2(b.x, b.y);
      const d = toward.clone().sub(c);
      const sx = d.x === 0 ? Infinity : b.w / 2 / Math.abs(d.x);
      const sy = d.y === 0 ? Infinity : b.h / 2 / Math.abs(d.y);
      const s = Math.min(sx, sy);
      return c.add(d.multiplyScalar(s + 0.08 / d.length()));
    };

    const flows: { path: THREE.Vector3[]; lens: number[]; total: number; n: number; off: number }[] = [];
    for (const e of spec.edges) {
      const A = boxes.get(e.from)!, B = boxes.get(e.to)!;
      const via = (e.via ?? []).map(([x, y]) => new THREE.Vector2(x, y));
      const first = via[0] ?? new THREE.Vector2(B.x, B.y);
      const last = via[via.length - 1] ?? new THREE.Vector2(A.x, A.y);
      const pts2 = [anchor(e.from, first), ...via, anchor(e.to, last)];
      const path = pts2.map((p) => new THREE.Vector3(p.x, p.y, 0));
      const flat: number[] = [];
      for (let i = 0; i < path.length - 1; i++) flat.push(...path[i].toArray(), ...path[i + 1].toArray());
      g.add(segs(flat, e.dashed ? dashed() : line(0.8)));
      // arrowhead
      const tip = path[path.length - 1], prev = path[path.length - 2];
      const dir = tip.clone().sub(prev).normalize();
      const head = edges(new THREE.ConeGeometry(0.16, 0.42, 6), line());
      head.position.copy(tip.clone().addScaledVector(dir, -0.21));
      head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(head);
      if (e.label) {
        // put the label on the longest segment, just above it
        let k = 0, best = -1;
        for (let i = 0; i < path.length - 1; i++) {
          const L = path[i].distanceTo(path[i + 1]);
          if (L > best) ((best = L), (k = i));
        }
        const mid = path[k].clone().lerp(path[k + 1], 0.5);
        const lb = label(e.label, 0.3, 0.85, 500, true);
        const horizontal = Math.abs(path[k + 1].y - path[k].y) < 0.01;
        lb.sprite.position.set(mid.x + (horizontal ? 0 : lb.width / 2 + 0.2), mid.y + (horizontal ? 0.3 : 0), 0.1);
        g.add(lb.sprite);
      }
      if (e.flow) {
        const lens = path.slice(1).map((p, i) => p.distanceTo(path[i]));
        flows.push({ path, lens, total: lens.reduce((a, b) => a + b, 0), n: e.flow, off: rnd() });
      }
    }

    for (const f of spec.frames ?? []) {
      const [x0, y0] = f.from, [x1, y1] = f.to;
      g.add(segs([x0, y0, -0.6, x1, y0, -0.6, x1, y0, -0.6, x1, y1, -0.6, x1, y1, -0.6, x0, y1, -0.6, x0, y1, -0.6, x0, y0, -0.6], dashed(0.35)));
      const lb = label(f.title, 0.3, 0.6);
      lb.sprite.position.set(x0 + lb.width / 2 + 0.25, y0 + 0.32, -0.5);
      g.add(lb.sprite);
    }

    const xs = [...boxes.values()].flatMap((b) => [b.x - b.w / 2, b.x + b.w / 2]);
    const ys = [...boxes.values()].flatMap((b) => [b.y + b.h / 2]);
    const head = label(spec.heading, 0.55, 1, 600);
    const vias = spec.edges.flatMap((e) => (e.via ?? []).map(([, y]) => y));
    head.sprite.position.set((Math.min(...xs) + Math.max(...xs)) / 2, Math.max(...ys, ...vias, ...(spec.frames ?? []).map((f) => f.to[1])) + 1.3, 0);
    g.add(head.sprite);

    // packets riding the live edges
    const count = flows.reduce((a, f) => a + f.n, 0);
    const arr = new Float32Array(count * 3);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    g.add(new THREE.Points(pg, dots(0.3)));
    const at = (f: (typeof flows)[number], u: number, out: THREE.Vector3) => {
      let d = u * f.total;
      for (let i = 0; i < f.lens.length; i++) {
        if (d <= f.lens[i]) return out.copy(f.path[i]).lerp(f.path[i + 1], d / f.lens[i]);
        d -= f.lens[i];
      }
      return out.copy(f.path[f.path.length - 1]);
    };
    const tmp = new THREE.Vector3();
    tickers.push((t) => {
      let k = 0;
      for (const f of flows)
        for (let j = 0; j < f.n; j++) {
          at(f, (t * (2.2 / f.total) + f.off + j / f.n) % 1, tmp);
          arr.set([tmp.x, tmp.y, 0.05], k++ * 3);
        }
      pg.attributes.position.needsUpdate = true;
    });

    // a faint floor grid under each system
    const grid = new THREE.GridHelper(46, 46);
    grid.material = line(0.08);
    grid.position.y = Math.min(...[...boxes.values()].map((b) => b.y - b.h / 2)) - 2.2;
    g.add(grid);
    return g;
  }

  // ---------- solid parts: background-filled faces under the edges, so hidden lines drop out ----------
  const FACE = face();
  const solid = (w: number, h: number, d: number, alpha = 1) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, FACE), edges(geo, line(alpha)));
    return g;
  };
  const drum = (r: number, h: number, alpha = 1) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 28);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, FACE), edges(geo, line(alpha), 30));
    return g;
  };
  const put = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => (o.position.set(x, y, z), o);
  const ring = (r: number, mat: THREE.LineBasicMaterial, n = 96) => {
    const l = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(Array.from({ length: n }, (_, i) => new THREE.Vector3(Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r, 0))),
      mat,
    );
    if (mat instanceof THREE.LineDashedMaterial) l.computeLineDistances();
    return l;
  };
  // A hole seen from above: a flat ring on the board.
  const hole = (x: number, z: number, y: number) => {
    const r = ring(0.22, line(0.6), 20);
    r.rotation.x = -Math.PI / 2;
    return put(r, x, y, z);
  };
  // A 2×20 pin header along x, centred on (x, z), pins standing up from the board top `y`.
  const header = (x: number, z: number, y: number) => {
    const g = new THREE.Group();
    g.add(put(solid(6.5, 0.3, 0.68), x, y + 0.15, z));
    const pins: number[] = [];
    for (let i = 0; i < 20; i++)
      for (const dz of [-0.16, 0.16]) {
        const px = x - 3.04 + i * 0.32;
        pins.push(px, y + 0.3, z + dz, px, y + 0.85, z + dz);
      }
    g.add(segs(pins, line(0.8)));
    return g;
  };
  // A port on the board edge: its body plus the opening(s) on the outward (+z) face.
  const port = (w: number, h: number, d: number, slots: [number, number, number][] = []) => {
    const g = solid(w, h, d);
    for (const [sw, sh, sy] of slots) g.add(put(box(sw, sh, 0.01, line(0.7)), 0, sy, d / 2 + 0.01));
    return g;
  };
  // Faint copper on the board surface, routed in right angles like the real thing.
  const traces = (w: number, d: number, y: number, n: number) => {
    const tr: number[] = [];
    for (let i = 0; i < n; i++) {
      let x = (rnd() - 0.5) * w, z = (rnd() - 0.5) * d;
      for (let k = 0; k < 3; k++) {
        const nx = k % 2 ? x : THREE.MathUtils.clamp(x + (rnd() - 0.5) * w * 0.5, -w / 2, w / 2);
        const nz = k % 2 ? THREE.MathUtils.clamp(z + (rnd() - 0.5) * d * 0.5, -d / 2, d / 2) : z;
        tr.push(x, y, z, nx, y, nz);
        x = nx;
        z = nz;
      }
    }
    return segs(tr, line(0.22));
  };

  // Packets running along a world-space polyline (rails, deploy links).
  function runner(path: THREE.Vector3[], n: number, size: number, speed: number) {
    const lens = path.slice(1).map((p, i) => p.distanceTo(path[i]));
    const total = lens.reduce((a, b) => a + b, 0);
    const arr = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(geo, dots(size));
    pts.frustumCulled = false; // positions move every frame; the initial bounds would be wrong
    const off = rnd(), tmp = new THREE.Vector3();
    tickers.push((t) => {
      for (let j = 0; j < n; j++) {
        let d = (((t * speed) / total + off + j / n) % 1) * total;
        let i = 0;
        while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
        tmp.copy(path[i]).lerp(path[i + 1], Math.min(1, d / lens[i]));
        arr.set([tmp.x, tmp.y, tmp.z], j * 3);
      }
      geo.attributes.position.needsUpdate = true;
    });
    return pts;
  }
  const polyline = (path: THREE.Vector3[], mat: THREE.LineBasicMaterial) => {
    const flat: number[] = [];
    for (let i = 0; i < path.length - 1; i++) flat.push(...path[i].toArray(), ...path[i + 1].toArray());
    return segs(flat, mat);
  };

  // ---------- 1. Edge: Jetson Nano and a Rockchip board, one model deployed to both ----------
  {
    const g = new THREE.Group();
    g.position.copy(v3(POS.chip));

    // NVIDIA Jetson Nano developer kit: carrier, module under a finned heatsink and fan,
    // the port row along the front, the 40-pin header along the back.
    const jet = new THREE.Group();
    jet.position.set(-9, 0, 0);
    const JT = 0.2; // carrier top
    jet.add(put(solid(12.5, 0.2, 10), 0, 0.1, 0));
    jet.add(traces(12, 9.4, JT + 0.005, 46));
    for (const [x, z] of [[-5.7, -4.4], [5.7, -4.4], [-5.7, 4.4], [5.7, 4.4]]) jet.add(hole(x, z, JT + 0.01));
    jet.add(put(solid(8.6, 0.12, 5.4), 0, 0.85, -1.4)); // compute module (SO-DIMM)
    for (const [x, z] of [[-4, -3.8], [4, -3.8], [-4, 1], [4, 1]]) jet.add(put(drum(0.12, 0.6, 0.6), x, 0.5, z));
    jet.add(put(solid(7.6, 0.35, 5), 0, 1.09, -1.4)); // heatsink base
    for (let i = 0; i < 15; i++) jet.add(put(solid(0.1, 2.5, 5, 0.85), -3.5 + i * 0.5, 2.5, -1.4));
    const FAN_Y = 3.95;
    jet.add(put(solid(4.6, 0.4, 4.6), 0, FAN_Y, -1.4));
    const fan = new THREE.Group();
    fan.position.set(0, FAN_Y + 0.21, -1.4);
    const fr = ring(2.05, line(0.9));
    fr.rotation.x = -Math.PI / 2;
    fan.add(fr);
    const blades: number[] = [];
    for (let b = 0; b < 7; b++) {
      const a0 = (b / 7) * Math.PI * 2;
      for (let k = 0; k < 6; k++) {
        const r0 = 0.55 + (k / 6) * 1.35, r1 = 0.55 + ((k + 1) / 6) * 1.35;
        const s0 = a0 + (k / 6) * 0.7, s1 = a0 + ((k + 1) / 6) * 0.7;
        blades.push(Math.cos(s0) * r0, 0, Math.sin(s0) * r0, Math.cos(s1) * r1, 0, Math.sin(s1) * r1);
      }
    }
    const spin = segs(blades, line(0.85));
    fan.add(spin, put(drum(0.55, 0.12), 0, 0, 0));
    jet.add(fan);
    tickers.push((t) => (spin.rotation.y = -t * 3));
    // front port row (+z): barrel jack, HDMI, DisplayPort, 2× USB 3 stacks, RJ45
    const FZ = 4.4;
    jet.add(put(drum(0.5, 1.6), -5.3, JT + 0.55, FZ).rotateX(Math.PI / 2));
    jet.add(put(port(1.8, 0.75, 1.4, [[1.3, 0.35, 0]]), -3.75, JT + 0.38, FZ));
    jet.add(put(port(1.8, 0.75, 1.4, [[1.3, 0.35, 0]]), -1.7, JT + 0.38, FZ));
    for (const x of [0.5, 2.6]) jet.add(put(port(1.8, 1.9, 2, [[1.3, 0.45, -0.45], [1.3, 0.45, 0.45]]), x, JT + 0.95, FZ - 0.3));
    jet.add(put(port(2, 1.7, 2.6, [[1.3, 1.05, -0.1]]), 4.95, JT + 0.85, FZ - 0.6));
    jet.add(header(0.6, -4.45, JT));
    jet.add(put(solid(0.5, 0.3, 1.9), -5.75, JT + 0.15, -1)); // MIPI CSI camera connector
    g.add(jet);
    const jl = label("JETSON NANO", 0.62, 1, 600);
    jl.sprite.position.set(-9, 6.3, -1.4);
    g.add(jl.sprite);

    // Rockchip single-board computer: SoC with its NPU under a pin-fin sink, LPDDR around it,
    // ports along the front, 40-pin header along the back, an M.2 slot.
    const rk = new THREE.Group();
    rk.position.set(9.5, 0, 0.5);
    const RT = 0.18;
    rk.add(put(solid(11, 0.18, 7.5), 0, 0.09, 0));
    rk.add(traces(10.6, 7, RT + 0.005, 38));
    for (const [x, z] of [[-5, -3.2], [5, -3.2], [-5, 3.2], [5, 3.2]]) rk.add(hole(x, z, RT + 0.01));
    rk.add(put(solid(2.3, 0.22, 2.3), -0.6, RT + 0.11, -0.4)); // SoC
    for (const [x, z] of [[-2.75, -0.95], [-2.75, 0.15], [1.55, -0.95], [1.55, 0.15]]) rk.add(put(solid(1.3, 0.14, 0.9, 0.7), x, RT + 0.07, z)); // LPDDR
    rk.add(put(solid(1.4, 0.14, 1.1, 0.7), 3.2, RT + 0.07, 1.2)); // eMMC
    rk.add(put(solid(0.9, 0.12, 0.9, 0.6), -3.6, RT + 0.06, 1.4)); // PMIC
    const SINK = RT + 0.3;
    rk.add(put(solid(2.6, 0.14, 2.6), -0.6, SINK + 0.07, -0.4));
    const pinsRk: number[] = [];
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const x = -0.6 - 1.08 + i * 0.36, z = -0.4 - 1.08 + j * 0.36;
        pinsRk.push(x, SINK + 0.14, z, x, SINK + 0.95, z);
      }
    rk.add(segs(pinsRk, line(0.75)));
    // front port row (+z): 2× USB stacks, RJ45, 2× HDMI, USB-C
    const RZ = 3.35;
    for (const x of [-4.3, -2.5]) rk.add(put(port(1.55, 1.6, 1.8, [[1.15, 0.4, -0.38], [1.15, 0.4, 0.38]]), x, RT + 0.8, RZ));
    rk.add(put(port(1.7, 1.4, 2.2, [[1.15, 0.85, -0.1]]), -0.45, RT + 0.7, RZ - 0.2));
    for (const x of [1.5, 3.05]) rk.add(put(port(1.35, 0.6, 1.1, [[1, 0.28, 0]]), x, RT + 0.3, RZ + 0.3));
    rk.add(put(port(0.95, 0.35, 0.8, [[0.7, 0.15, 0]]), 4.5, RT + 0.18, RZ + 0.45));
    rk.add(header(0.5, -3.3, RT));
    rk.add(put(solid(1.7, 0.25, 0.5), 3.6, RT + 0.12, -1.3)); // M.2 key-M slot
    rk.add(put(solid(0.5, 0.25, 1.9), -5.15, RT + 0.12, -0.7)); // MIPI CSI
    g.add(rk);
    const rl = label("ROCKCHIP", 0.62, 1, 600);
    rl.sprite.position.set(8.9, 3.2, 0.1);
    g.add(rl.sprite);

    // one model, deployed down to both boards
    const net = new THREE.Group();
    const layers: THREE.Vector3[][] = [];
    [2, 3, 5, 6].forEach((n, li) => {
      const ly: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) ly.push(new THREE.Vector3((i - (n - 1) / 2) * 0.5, li * 0.6, (j - (n - 1) / 2) * 0.5));
      layers.push(ly);
    });
    net.add(points(layers.flat().flatMap((v) => v.toArray()), dots(0.09)));
    const wires: number[] = [];
    for (let li = 0; li < layers.length - 1; li++)
      for (const b of layers[li + 1]) {
        const a = layers[li][Math.floor(rnd() * layers[li].length)];
        wires.push(...a.toArray(), ...b.toArray());
      }
    net.add(segs(wires, line(0.3)));
    const NET = new THREE.Vector3(0.3, 5.6, -1.2);
    net.position.copy(NET);
    g.add(net);
    tickers.push((t) => (net.rotation.y = t * 0.25));
    const ml = label("one model", 0.34, 0.75);
    ml.sprite.position.set(NET.x, NET.y + 2.5, NET.z);
    g.add(ml.sprite);
    for (const [to, ctrl, text] of [
      [new THREE.Vector3(-9, FAN_Y + 0.5, -1.4), new THREE.Vector3(-4.5, 7.2, -1.3), "CUDA · TensorRT"],
      [new THREE.Vector3(8.9, SINK + 1.15, 0.1), new THREE.Vector3(5.5, 6.8, -0.6), "NPU · INT8"],
    ] as const) {
      const path = new THREE.QuadraticBezierCurve3(NET.clone().add(new THREE.Vector3(0, -0.2, 0)), ctrl, to).getPoints(40);
      g.add(polyline(path, dashed(0.55)), runner(path, 4, 0.2, 2.2));
      const lb = label(text, 0.3, 0.85);
      lb.sprite.position.copy(path[20]).add(new THREE.Vector3(0, 0.45, 0));
      g.add(lb.sprite);
    }
    scene.add(g);
  }

  // ---------- 2. Tet Hlan humanoid ----------
  {
    const g = new THREE.Group();
    g.position.copy(v3(POS.humanoid));
    const terrain = new THREE.PlaneGeometry(34, 34, 34, 34);
    const pos = terrain.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, 0.25 * Math.sin(x * 0.5) * Math.cos(y * 0.4) + (Math.hypot(x, y) > 6 ? 0.15 * Math.sin(x + y) : 0));
    }
    const ground = new THREE.LineSegments(new THREE.WireframeGeometry(terrain), line(0.18));
    ground.rotation.x = -Math.PI / 2;
    g.add(ground);

    const robot = new THREE.Group();
    const m = line();
    const pelvis = box(1.5, 0.4, 0.8, m);
    pelvis.position.y = 3.4;
    robot.add(pelvis);
    const torso = box(1.7, 2.1, 0.95, m);
    torso.position.y = 4.75;
    robot.add(torso);
    const head = box(0.8, 0.8, 0.8, m);
    head.position.y = 6.3;
    robot.add(head);
    const joint = () => edges(new THREE.IcosahedronGeometry(0.17, 0), m);
    type Leg = { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group; arm: THREE.Group };
    const legs: Leg[] = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0.45 * s, 3.25, 0);
      hip.add(joint());
      const thigh = box(0.4, 1.5, 0.45, m);
      thigh.position.y = -0.8;
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -1.6;
      knee.add(joint());
      const shin = box(0.35, 1.5, 0.4, m);
      shin.position.y = -0.8;
      knee.add(shin);
      const ankle = new THREE.Group();
      ankle.position.y = -1.6;
      ankle.add(joint());
      const foot = box(0.5, 0.14, 1, m);
      foot.position.set(0, -0.08, 0.2);
      ankle.add(foot);
      knee.add(ankle);
      hip.add(knee);
      robot.add(hip);
      const arm = new THREE.Group();
      arm.position.set(1.05 * s, 5.6, 0);
      arm.add(joint());
      const upper = box(0.32, 1.9, 0.32, m);
      upper.position.y = -1;
      arm.add(upper);
      robot.add(arm);
      legs.push({ hip, knee, ankle, arm });
    }
    const fan: number[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 0.9 - Math.PI * 0.45;
      fan.push(0, 6.3, 0, Math.sin(a) * 9, 0.2, Math.cos(a) * 9);
    }
    const lidar = segs(fan, line(0.16));
    robot.add(lidar);
    g.add(robot);
    const lb = label("12-DOF · 50 Hz", 0.5);
    lb.sprite.position.set(0, 7.4, 0);
    g.add(lb.sprite);
    tickers.push((t) => {
      const ph = t * 4.2;
      legs.forEach((l, i) => {
        const p = ph + i * Math.PI;
        l.hip.rotation.x = 0.42 * Math.sin(p);
        l.knee.rotation.x = Math.max(0, 0.85 * Math.sin(p - 1.2));
        l.ankle.rotation.x = -0.25 * Math.sin(p - 0.6);
        l.arm.rotation.x = -0.35 * Math.sin(p);
      });
      robot.position.y = 0.06 * Math.abs(Math.sin(ph));
      lidar.rotation.y = Math.sin(t * 0.8) * 0.4;
    });
    scene.add(g);
  }

  // ---------- 3. LLM → robot adapter, with the SO-ARM101 it drives ----------
  {
    const g = diagram(HANDS);
    g.position.copy(v3(POS.hands));
    const m = line();
    const arm = new THREE.Group();
    arm.position.set(14, -4.6, 0);
    const table = box(6, 0.3, 4, line(0.6));
    table.position.y = 1.5;
    arm.add(table);
    const base = edges(new THREE.CylinderGeometry(0.6, 0.75, 0.5, 10), m);
    base.position.y = 1.9;
    arm.add(base);
    const j1 = new THREE.Group();
    j1.position.y = 2.15;
    arm.add(j1);
    const j2 = new THREE.Group();
    j2.position.y = 0.35;
    j1.add(j2);
    const upper = box(0.38, 2.2, 0.38, m);
    upper.position.y = 1.1;
    j2.add(upper);
    const j3 = new THREE.Group();
    j3.position.y = 2.2;
    j2.add(j3);
    const fore = box(0.32, 1.9, 0.32, m);
    fore.position.y = 0.95;
    j3.add(fore);
    const j4 = new THREE.Group();
    j4.position.y = 1.9;
    j3.add(j4);
    j4.add(box(0.5, 0.35, 0.35, m));
    for (const s of [-1, 1]) {
      const finger = box(0.08, 0.55, 0.2, m);
      finger.position.set(0.18 * s, 0.42, 0);
      j4.add(finger);
    }
    const card = new THREE.Group();
    card.add(box(0.9, 0.6, 0.02, m));
    const hello = label("HELLO", 0.22);
    hello.sprite.position.z = 0.03;
    card.add(hello.sprite);
    card.position.y = 0.95;
    j4.add(card);
    const tag = label("SO-ARM101", 0.4, 0.8);
    tag.sprite.position.set(0, 0.8, 2.4);
    arm.add(tag.sprite);
    g.add(arm);
    // runtime → arm link
    g.add(segs([10.5, 1, 0, 12.6, 1, 0, 12.6, 1, 0, 12.6, -2.4, 0], line(0.8)));

    tickers.push((t) => {
      const s = (Math.sin(t * 0.9) + 1) / 2;
      j1.rotation.y = 0.6 - s * 1.2;
      j2.rotation.z = -0.9 + s * 0.6;
      j3.rotation.z = 1.5 - s * 0.9;
      j4.rotation.z = 0.5 - s * 0.4;
    });
    scene.add(g);
  }

  // ---------- 4. voice runtime, with the device fleet feeding it ----------
  {
    const g = diagram(VOICE);
    g.position.copy(v3(POS.voice));
    const m = line(0.7);
    for (let i = 0; i < 5; i++) {
      const dev = box(0.9, 0.25, 0.55, m);
      dev.position.set(-20.5 + (i % 2) * 1.2, -2.2 + i * 1.3, 0);
      g.add(dev);
      g.add(segs([dev.position.x + 0.45, dev.position.y, 0, -14.9, 1, 0], line(0.18)));
    }
    scene.add(g);
  }

  // ---------- 5. Mindroid pipeline ----------
  {
    const g = diagram(AGENT);
    g.position.copy(v3(POS.agent));
    scene.add(g);
  }

  // ---------- 6. memory + RAG ----------
  {
    const g = diagram(MEMORY);
    g.position.copy(v3(POS.memory));
    scene.add(g);
  }

  // ---------- camera path ----------
  const posCurve = new THREE.CatmullRomCurve3(KEYS.map(([p]) => v3(p)), false, "centripetal");
  const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map(([, t]) => v3(t)), false, "centripetal");

  // ---------- transitions: a portal ring on the sightline into each world ----------
  for (const { stop, view } of portals()) {
    const [cam, look] = view.map(v3);
    const dir = look.clone().sub(cam).normalize();
    const p = new THREE.Group();
    p.position.copy(cam).addScaledVector(dir, -RING_BACK);
    p.lookAt(look);
    const R = 5.2;
    p.add(ring(R, line(0.9)));
    const inner = ring(R - 0.45, dashed(0.5), 120);
    const ticks = new THREE.Group();
    const tk: number[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, r1 = R + (i % 4 ? 0.35 : 0.8);
      tk.push(Math.cos(a) * (R + 0.15), Math.sin(a) * (R + 0.15), 0, Math.cos(a) * r1, Math.sin(a) * r1, 0);
    }
    ticks.add(segs(tk, line(0.6)));
    p.add(inner, ticks);
    const lb = label(`→ ${stop.kicker}`, 0.5, 1, 600);
    lb.sprite.position.set(0, R + 1.6, 0);
    p.add(lb.sprite);
    tickers.push((t) => {
      inner.rotation.z = -t * 0.3;
      ticks.rotation.z = t * 0.12;
    });
    scene.add(p);
  }

  // dust between the worlds, for a sense of speed while flying; kept out of the scenes themselves
  {
    const centres = Object.values(POS).map((c) => new THREE.Vector2(c[0], c[2]));
    const d: number[] = [];
    while (d.length < 2600 * 3) {
      const x = -40 + rnd() * 440, y = -14 + rnd() * 46, z = -50 + rnd() * 100;
      if (centres.some((c) => Math.hypot(c.x - x, c.y - z) < 22)) continue;
      d.push(x, y, z);
    }
    scene.add(points(d, dots(0.1, 0.5)));
  }

  // The camera eases toward the scroll position instead of jumping with each wheel tick.
  let target = 0, shown = 0, lastT = 0, pull = 1;
  const look = new THREE.Vector3();
  function place(dt: number) {
    shown = opts.reduced || !running || dt <= 0 ? target : shown + (target - shown) * (1 - Math.exp(-dt * 4));
    const p = THREE.MathUtils.clamp(shown, 0, 1);
    tgtCurve.getPoint(p, look);
    // narrow screens stand further back along the same sightline, so wide scenes still fit
    camera.position.copy(posCurve.getPoint(p)).sub(look).multiplyScalar(pull).add(look);
    camera.lookAt(look);
  }

  // ---------- loop ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens see the diagrams from further back
    camera.fov = w < 700 ? 74 : 50;
    pull = w < 700 ? 1.35 : 1;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => {
    resize();
    frame(performance.now());
  });
  ro.observe(canvas);

  const mo = new MutationObserver(applyTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", applyTheme);
  applyTheme();
  resize();

  let running = false, raf = 0;
  const t0 = performance.now();
  function frame(now: number) {
    const t = opts.reduced ? 1.5 : (now - t0) / 1000;
    for (const f of tickers) f(t);
    place(Math.min(0.1, (now - lastT) / 1000));
    lastT = now;
    renderer.render(scene, camera);
  }
  function loop(now: number) {
    frame(now);
    if (running) raf = requestAnimationFrame(loop);
  }
  frame(t0);

  return {
    setProgress(p) {
      target = p;
      if (!running) frame(performance.now());
    },
    setRunning(on) {
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", applyTheme);
      renderer.dispose();
    },
  };
}
