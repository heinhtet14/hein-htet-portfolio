// The live viewer's worlds, shared by the page (tabs and captions) and the renderer (where
// each world sits and the camera's view of it). Views are [camera position, look-at],
// relative to the world's position, in world units.

export type V3 = [number, number, number];

export const POS = {
  chip: [0, 0, 0],
  humanoid: [60, 0, 0],
  hands: [130, 0, 0],
  voice: [205, 0, 0],
  agent: [280, 0, 0],
  memory: [358, 0, 0],
} satisfies Record<string, V3>;

export interface Scene {
  tab: string;
  kicker: string;
  title: string;
  body: string;
  view: [V3, V3];
}

const at = (base: V3, [x, y, z]: V3): V3 => [base[0] + x, base[1] + y, base[2] + z];
const view = (base: V3, cam: V3, look: V3): [V3, V3] => [at(base, cam), at(base, look)];

export const SCENES: Scene[] = [
  {
    tab: "edge",
    kicker: "01 · edge",
    title: "Models that fit the chip",
    body: "Pruned, quantized and compiled networks, and small LLMs, running on the board itself: NVIDIA Jetson and the Rockchip RK3588 NPU.",
    view: view(POS.chip, [0, 11, 21], [0, 3.6, 0]),
  },
  {
    tab: "body",
    kicker: "02 · body",
    title: "Tet Hlan, 12-DOF humanoid",
    body: "An RL walking policy trained in Isaac Lab, checked in MuJoCo, then run on the robot at 50 Hz.",
    view: view(POS.humanoid, [-10, 6, 13], [0, 4.4, 0]),
  },
  {
    tab: "hands",
    kicker: "03 · Magick Mind · hands",
    title: "LLM → robot",
    body: "The agent decides what to do, the robot decides how. Intents go down, events come back up, and motion stays deterministic and safe.",
    view: view(POS.hands, [1.5, 1.5, 24], [1.5, 0, 0]),
  },
  {
    tab: "voice",
    kicker: "04 · Magick Mind · voice",
    title: "Real-time voice",
    body: "Low-latency conversation for a fleet of small devices: listen, think in character, speak back, and stop when interrupted.",
    view: view(POS.voice, [-1.5, 1.5, 21], [-1.5, 0, 0]),
  },
  {
    tab: "agent",
    kicker: "05 · Magick Mind · agent",
    title: "Mindroid agent runtime",
    body: "An open-source Rust runtime for agents: builds context, streams the model, loops through tools, and ships for cloud or edge.",
    view: view(POS.agent, [-0.5, 2.5, 22], [-0.5, 1.6, 0]),
  },
  {
    tab: "memory",
    kicker: "06 · Magick Mind · memory",
    title: "Memory + knowledge",
    body: "Agents that remember past conversations and look things up in documents, measured on public long-memory benchmarks.",
    view: view(POS.memory, [-0.5, 1.5, 20], [-0.5, 0.8, 0]),
  },
];
