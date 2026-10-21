// The home page's scroll world: three.js loads only when the section is near the screen.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

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


export {};
