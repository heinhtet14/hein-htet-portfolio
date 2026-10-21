// Scroll-scrubbed wireframe world. The camera flies chip → humanoid → the Magick Mind systems
// (LLM → robot, voice, agent runtime, memory), then pulls out to show all of it. The system
// diagrams stay deliberately high level: company work, so no internals.
// Scroll position drives the camera; only small idle motions autoplay, and they stop under
// prefers-reduced-motion. Camera keys and captions live in src/data/world-path.ts.
import * as THREE from "three";
import { KEYS, POS, type V3 } from "../data/world-path";

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

  const edges = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
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

  // ---------- 1. Edge chip ----------
  {
    const g = new THREE.Group();
    g.position.copy(v3(POS.chip));
    g.add(box(26, 0.4, 17, line()));
    const tr: number[] = [];
    for (let i = 0; i < 90; i++) {
      let x = (rnd() - 0.5) * 24, z = (rnd() - 0.5) * 15;
      const y = 0.21;
      for (let k = 0; k < 3; k++) {
        const nx = k % 2 ? x : x * 0.55, nz = k % 2 ? z * 0.6 : z;
        tr.push(x, y, z, nx, y, nz);
        x = nx;
        z = nz;
      }
    }
    g.add(segs(tr, line(0.35)));
    const mod = box(11, 0.35, 7.5, line());
    mod.position.y = 0.6;
    g.add(mod);
    for (let i = 0; i < 16; i++) {
      const fin = box(0.08, 2.2, 6.6, line(0.35));
      fin.position.set(-5 + i * 0.28, 1.9, 0);
      g.add(fin);
    }
    const soc = box(3, 0.3, 3, line());
    soc.position.set(2.2, 0.95, 0);
    g.add(soc);
    const pins: number[] = [];
    for (let i = 0; i < 12; i++)
      for (const s of [-1, 1]) {
        const o = -1.4 + i * 0.25;
        pins.push(2.2 + o, 0.8, 1.7 * s, 2.2 + 1.7 * s, 0.8, o);
      }
    g.add(points(pins, dots(0.08)));
    const net = new THREE.Group();
    const layers: THREE.Vector3[][] = [];
    [6, 5, 3, 2].forEach((n, li) => {
      const ly: THREE.Vector3[] = [];
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) ly.push(new THREE.Vector3((i - (n - 1) / 2) * 0.42, 1.25 + li * 0.55, (j - (n - 1) / 2) * 0.42));
      layers.push(ly);
    });
    net.add(points(layers.flat().flatMap((v) => v.toArray()), dots(0.06)));
    const wires: number[] = [];
    for (let li = 0; li < layers.length - 1; li++)
      for (const a of layers[li]) {
        const b = layers[li + 1][Math.floor(rnd() * layers[li + 1].length)];
        wires.push(...a.toArray(), ...b.toArray());
      }
    net.add(segs(wires, line(0.3)));
    const netHolder = new THREE.Group();
    netHolder.position.set(2.2, 0, 0);
    netHolder.add(net);
    g.add(netHolder);
    const l1 = label("INT8 · TensorRT", 0.28);
    l1.sprite.position.set(2.2, 3.5, 0);
    g.add(l1.sprite);
    const l2 = label("JETSON", 0.9);
    l2.sprite.position.set(-8, 0.9, 6);
    g.add(l2.sprite);
    tickers.push((t) => (net.rotation.y = t * 0.25));
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
  let progress = 0;
  const look = new THREE.Vector3();
  function place() {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    camera.position.copy(posCurve.getPoint(p));
    camera.lookAt(tgtCurve.getPoint(p, look));
  }

  // ---------- loop ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens see the diagrams from further back
    camera.fov = w < 700 ? 74 : 50;
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
    place();
    renderer.render(scene, camera);
  }
  function loop(now: number) {
    frame(now);
    if (running) raf = requestAnimationFrame(loop);
  }
  frame(t0);

  return {
    setProgress(p) {
      progress = p;
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
