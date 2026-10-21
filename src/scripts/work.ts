// The work page: the area filter (also driven by #u/<id> links) and the archive lightbox.
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-warp]")];

/* ---------------- Area filter ---------------- */

function warp(id: string) {
  const b = buttons.find((x) => x.dataset.warp === id);
  if (!b) return false;
  root.dataset.universe = id;
  $("#u-note").textContent = b.dataset.tagline!;
  for (const x of buttons) x.setAttribute("aria-pressed", String(x === b));
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

for (const b of buttons) b.addEventListener("click", () => warp(b.dataset.warp!));

// #u/<id> filters; #p-<slug> (from the home page or the terminal) opens that project
function follow() {
  const area = location.hash.match(/^#u\/(\w+)/)?.[1];
  if (area && !warp(area)) warp("all");
  const linked = location.hash.startsWith("#p-") ? document.querySelector<HTMLElement>(location.hash) : null;
  if (!linked) return;
  if (linked.hidden) warp("all");
  linked.querySelector("details")!.open = true;
  linked.scrollIntoView({ block: "center" });
}
follow();
addEventListener("hashchange", follow);

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

export {};
