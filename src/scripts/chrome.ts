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
