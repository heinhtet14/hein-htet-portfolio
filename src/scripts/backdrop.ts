// Faint background of what an edge device is busy with: bytes, hex dumps, int8 tensor rows and
// inference ops, drifting upward in a few independent streams. Pure 2D canvas, ~12 fps, paused
// while the tab is hidden, and a single still frame under prefers-reduced-motion.

const canvas = document.getElementById("backdrop") as HTMLCanvasElement | null;
const ctx = canvas?.getContext("2d");

if (canvas && ctx) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FONT = 11;
  const LINE = 16;
  const FPS = 12;

  const pick = <T,>(a: readonly T[]) => a[(Math.random() * a.length) | 0];
  const hex = () => (Math.random() * 256) | 0;
  const byte = () => hex().toString(2).padStart(8, "0");
  const h2 = () => hex().toString(16).padStart(2, "0");
  const q = () => String(Math.round(Math.random() * 254 - 127)).padStart(4, " ");
  const f = () => (Math.random() * 2 - 1).toFixed(3).padStart(6, " ");

  const OPS = [
    "conv2d 3x3 s1 → relu",
    "matmul  [1,512]x[512,512]",
    "dequant q8_0 → fp16",
    "softmax(qk^T / √d)",
    "kv_cache.append(t)",
    "rmsnorm  eps=1e-5",
    "rope  θ=10000",
    "argmax → token",
    "dma  sram ← flash",
    "tensorrt  int8  calib",
    "prune  sparsity=0.5",
    "for t in tokens:",
    "  logits = model(t)",
    "yield decode(t)",
    "attn  heads=8  d=64",
    "gelu(x) · w2",
    "quantize  per-channel",
    "cuda.sync()  2.1 ms",
  ] as const;

  const gens: (() => string)[] = [
    () => Array.from({ length: 4 }, byte).join(" "),
    () => `0x${(hex() << 8 | hex()).toString(16).padStart(4, "0")}  ${Array.from({ length: 8 }, h2).join(" ")}`,
    () => `[${Array.from({ length: 6 }, q).join("")} ]`,
    () => `[${Array.from({ length: 4 }, f).join(" ")} ]`,
    () => pick(OPS),
  ];
  const lineOf = () => pick(gens)();

  interface Stream {
    x: number;
    speed: number; // px per frame
    off: number;
    lines: string[];
  }
  let streams: Stream[] = [];
  let W = 0, H = 0;

  function layout() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas!.width = W * dpr;
    canvas!.height = H * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.font = `400 ${FONT}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx!.textBaseline = "top";
    const colW = 300;
    const n = Math.max(1, Math.round(W / colW));
    const rows = Math.ceil(H / LINE) + 2;
    streams = Array.from({ length: n }, (_, i) => ({
      x: i * (W / n) + 12,
      speed: 0.25 + Math.random() * 0.5,
      off: Math.random() * LINE,
      lines: Array.from({ length: rows }, lineOf),
    }));
  }

  function draw() {
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#000";
    ctx!.clearRect(0, 0, W, H);
    ctx!.fillStyle = fg;
    for (const s of streams) {
      s.lines.forEach((text, r) => {
        // fade at the top and bottom of each stream
        const y = r * LINE - s.off;
        const edge = Math.min(y, H - y) / (H * 0.25);
        ctx!.globalAlpha = 0.1 * Math.max(0, Math.min(1, edge));
        ctx!.fillText(text, s.x, y);
      });
    }
    ctx!.globalAlpha = 1;
  }

  function step() {
    for (const s of streams) {
      s.off += s.speed;
      while (s.off >= LINE) {
        s.off -= LINE;
        s.lines.shift();
        s.lines.push(lineOf());
      }
      // live values: a row now and then gets recomputed in place
      if (Math.random() < 0.15) s.lines[(Math.random() * s.lines.length) | 0] = lineOf();
    }
    draw();
  }

  let timer = 0;
  const start = () => {
    if (!reduced && !timer && !document.hidden) timer = window.setInterval(step, 1000 / FPS);
  };
  const stop = () => {
    clearInterval(timer);
    timer = 0;
  };

  layout();
  draw();
  start();
  addEventListener("resize", () => {
    layout();
    draw();
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  // repaint immediately when the theme flips (system or the invert button)
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.fonts?.ready.then(draw);
}
