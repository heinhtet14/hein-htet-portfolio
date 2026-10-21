// Camera path and captions for the scroll world, shared by the page (captions) and the
// renderer (camera). Each stop owns a run of keyframes; its caption shows while the
// camera is on those keys. Keys are [camera position, look-at] in world units.
// A stop with `portal` is entered through a ring on the sightline of its first key: the
// camera bends onto that line, flies straight through the ring with the scene framed in
// it, and carries on into the first view. No caption shows during the approach.

export type V3 = [number, number, number];

export const POS = {
  chip: [0, 0, 0],
  humanoid: [60, 0, 0],
  hands: [130, 0, 0],
  voice: [205, 0, 0],
  agent: [280, 0, 0],
  memory: [358, 0, 0],
} satisfies Record<string, V3>;

export interface WorldStop {
  kicker: string;
  title: string;
  body: string;
  portal?: boolean;
  keys: [V3, V3][];
}

const at = (base: V3, [x, y, z]: V3): V3 => [base[0] + x, base[1] + y, base[2] + z];
const view = (base: V3, cam: V3, look: V3): [V3, V3] => [at(base, cam), at(base, look)];

export const STOPS: WorldStop[] = [
  {
    kicker: "01 · edge",
    title: "Models that fit the chip",
    body: "Pruned, quantized and compiled networks, and small LLMs, running on the board itself: NVIDIA Jetson and the Rockchip RK3588 NPU.",
    keys: [view(POS.chip, [0, 15, 27], [0, 2, 0]), view(POS.chip, [-3.5, 8, 13], [-9, 2.2, 0]), view(POS.chip, [14.5, 6.5, 11], [9.5, 0.8, 0])],
  },
  {
    kicker: "02 · body",
    title: "Tet Hlan, 12-DOF humanoid",
    body: "An RL walking policy trained in Isaac Lab, checked in MuJoCo, then run on the robot at 50 Hz.",
    portal: true,
    keys: [view(POS.humanoid, [-18, 10, 22], [0, 3, 0]), view(POS.humanoid, [-8, 5.5, 13], [0, 3.4, 0]), view(POS.humanoid, [8, 5, 10], [0, 3.4, 0])],
  },
  {
    kicker: "03 · Magick Mind · hands",
    title: "LLM → robot",
    body: "The agent decides what to do, the robot decides how. Intents go down, events come back up, and motion stays deterministic and safe.",
    portal: true,
    keys: [view(POS.hands, [0, 0.5, 30], [0.5, -0.5, 0]), view(POS.hands, [7, 0.5, 19], [7, -0.5, 0])],
  },
  {
    kicker: "04 · Magick Mind · voice",
    title: "Real-time voice",
    body: "Low-latency conversation for a fleet of small devices: listen, think in character, speak back, and stop when interrupted.",
    portal: true,
    keys: [view(POS.voice, [-4, 0.5, 30], [-4, 0, 0]), view(POS.voice, [3, 1, 19], [3, 0.5, 0])],
  },
  {
    kicker: "05 · Magick Mind · agent",
    title: "Mindroid agent runtime",
    body: "An open-source Rust runtime for agents: builds context, streams the model, loops through tools, and ships for cloud or edge.",
    portal: true,
    keys: [view(POS.agent, [0, 1.5, 29], [0, 1.2, 0]), view(POS.agent, [-1, 1.6, 22], [-1, 1.4, 0])],
  },
  {
    kicker: "06 · Magick Mind · memory",
    title: "Memory + knowledge",
    body: "Agents that remember past conversations and look things up in documents, measured on public long-memory benchmarks.",
    portal: true,
    keys: [view(POS.memory, [0, 0.5, 26], [0, 0.5, 0]), view(POS.memory, [-3, 0.4, 19.5], [-2, -0.6, 0])],
  },
  {
    kicker: "07 · world",
    title: "Edge → body → hands → voice → mind → memory",
    body: "One stack, from the die to the mind.",
    keys: [[[179, 45, 290], [179, -5, 0]]],
  },
];

// Approach keys sit this far back along the first view's sightline; the ring sits between them.
const IN = 40, OUT = 8;
export const RING_BACK = (IN + OUT) / 2;
function approach([cam, look]: [V3, V3]): [V3, V3][] {
  const d = look.map((v, i) => v - cam[i]);
  const n = Math.hypot(...d);
  const back = (k: number) => cam.map((v, i) => v - (d[i] / n) * k) as V3;
  return [
    [back(IN), look],
    [back(OUT), look],
  ];
}
const lead = (s: WorldStop) => (s.portal ? approach(s.keys[0]) : []);

export const KEYS: [V3, V3][] = STOPS.flatMap((s) => [...lead(s), ...s.keys]);

/** Each portal: the stop it leads into and its first view, whose sightline the ring sits on. */
export function portals(): { stop: WorldStop; view: [V3, V3] }[] {
  return STOPS.filter((s) => s.portal).map((s) => ({ stop: s, view: s.keys[0] }));
}

/** Scroll fraction range during which each stop's caption is shown. */
export function captionRanges(): { from: number; to: number }[] {
  const last = KEYS.length - 1;
  let i = 0;
  return STOPS.map((s, n) => {
    i += lead(s).length;
    const first = i;
    i += s.keys.length;
    const from = n === 0 ? 0 : (first - 0.35) / last;
    const to = n === STOPS.length - 1 ? 1.01 : (i - 1 + 0.35) / last;
    return { from, to };
  });
}
