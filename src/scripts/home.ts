// The home page's live viewer: tabs pick a world; three.js loads only when the viewer is near
// the screen and animates only while it is on screen.
import type { WorldHandle } from "./world";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const viewer = document.querySelector<HTMLElement>(".viewer");
const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement | null;
const tabs = [...document.querySelectorAll<HTMLButtonElement>("[data-scene]")];
const caps = [...document.querySelectorAll<HTMLElement>("[data-cap]")];
let world: WorldHandle | null = null;
let current = 0;

function pick(i: number) {
  current = i;
  tabs.forEach((t, k) => t.setAttribute("aria-pressed", String(k === i)));
  caps.forEach((c, k) => (c.hidden = k !== i));
  world?.show(i);
}
tabs.forEach((t, i) => t.addEventListener("click", () => pick(i)));

const webgl = (() => {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
})();

if (viewer && canvas) {
  if (!webgl) viewer.hidden = true;
  else {
    let visible = false;
    new IntersectionObserver(
      async ([e]) => {
        visible = e.isIntersecting;
        if (visible && !world) {
          const { mountWorld } = await import("./world");
          world = mountWorld(canvas, { reduced });
          world.show(current);
        }
        world?.setRunning(visible && !reduced);
      },
      { rootMargin: "25% 0px" },
    ).observe(viewer);
  }
}
