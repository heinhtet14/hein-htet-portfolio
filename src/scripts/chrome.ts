// Shared page chrome for every page: the saved theme, the footer "invert" button and the clock.

const root = document.documentElement;

try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
} catch {
  /* private mode: follow the system theme */
}

document.getElementById("theme")?.addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch {
    /* private mode: just don't remember */
  }
});

// Header dropdowns: one open at a time, closed by picking a link, clicking away or Escape.
const menus = [...document.querySelectorAll<HTMLDetailsElement>("details.menu")];
const closeMenus = (except?: HTMLDetailsElement) => menus.forEach((m) => m !== except && (m.open = false));
for (const menu of menus) {
  menu.addEventListener("toggle", () => menu.open && closeMenus(menu));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => (menu.open = false)));
}
document.addEventListener("click", (e) => {
  if (!(e.target as Element).closest("details.menu")) closeMenus();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = menus.find((m) => m.open);
  if (!open) return;
  open.open = false;
  open.querySelector("summary")?.focus();
});

const clock = document.getElementById("clock");
if (clock) {
  const tick = () =>
    (clock.textContent = `${new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
    })} local time`);
  tick();
  setInterval(tick, 30_000);
}
