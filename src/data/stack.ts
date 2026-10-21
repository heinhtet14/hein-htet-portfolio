// Logos come from Simple Icons (CC0, monochrome), then from extra-logos.ts for tools Simple
// Icons lacks. Anything still unmatched renders as a lettered tile.
import { extraLogos, type MaskLogo, type VectorLogo } from "./extra-logos";
import {
  siC,
  siClaude,
  siCrewai,
  siEtcd,
  siLangchain,
  siLanggraph,
  siMlflow,
  siNeo4j,
  siOpencv,
  siPydantic,
  siSqlite,
  siUv,
  siWeightsandbiases,
  siCplusplus,
  siDocker,
  siEspressif,
  siFastapi,
  siGit,
  siGithubactions,
  siGo,
  siHuggingface,
  siKubernetes,
  siLinux,
  siMongodb,
  siNextdotjs,
  siNvidia,
  siOllama,
  siOnnx,
  siPostgresql,
  siPython,
  siPytorch,
  siReact,
  siGooglegemini,
  siJsonwebtokens,
  siRay,
  siRedis,
  siRos,
  siRust,
  siStmicroelectronics,
  siTailwindcss,
  siTokio,
  siTypescript,
  siUltralytics,
  siVercel,
  siAstro,
} from "simple-icons";

export interface Icon {
  title: string;
  path: string;
}

export type AnyLogo = Icon | VectorLogo | MaskLogo;

/** Display name (as used in profile.ts stacks) → logo. Aliases share an icon. */
const icons: Record<string, Icon> = {
  Rust: siRust,
  Python: siPython,
  C: siC,
  "C++": siCplusplus,
  Go: siGo,
  TypeScript: siTypescript,
  PyTorch: siPytorch,
  TensorRT: siNvidia,
  Jetson: siNvidia,
  "Jetson Nano": siNvidia,
  "Isaac Lab": siNvidia,
  ONNX: siOnnx,
  "ONNX Runtime": siOnnx,
  ESP32: siEspressif,
  STM32: siStmicroelectronics,
  "YOLOv8": siUltralytics,
  Ollama: siOllama,
  "ROS 2": siRos,
  LeRobot: siHuggingface,
  Linux: siLinux,
  SocketCAN: siLinux,
  Docker: siDocker,
  Kubernetes: siKubernetes,
  "GitHub Actions": siGithubactions,
  Git: siGit,
  Postgres: siPostgresql,
  PostgreSQL: siPostgresql,
  MongoDB: siMongodb,
  Redis: siRedis,
  Ray: siRay,
  "Gemini Live": siGooglegemini,
  JWT: siJsonwebtokens,
  "Redis Cluster": siRedis,
  FastAPI: siFastapi,
  Tokio: siTokio,
  "Next.js": siNextdotjs,
  React: siReact,
  Astro: siAstro,
  Tailwind: siTailwindcss,
  Vercel: siVercel,
  "Claude API": siClaude,
  Claude: siClaude,
  LangChain: siLangchain,
  LangGraph: siLanggraph,
  CrewAI: siCrewai,
  "Hugging Face": siHuggingface,
  OpenCV: siOpencv,
  "Weights & Biases": siWeightsandbiases,
  MLflow: siMlflow,
  etcd: siEtcd,
  Pydantic: siPydantic,
  uv: siUv,
  Neo4j: siNeo4j,
  pgvector: siPostgresql,
  SQLite: siSqlite,
};

export const iconFor = (name: string): AnyLogo | undefined => icons[name] ?? extraLogos[name];

export const isWordmark = (name: string) => Boolean((iconFor(name) as VectorLogo | undefined)?.wordmark);

export interface StackGroup {
  name: string;
  items: string[];
}

export const stackGroups: StackGroup[] = [
  { name: "Languages", items: ["C", "C++", "Rust", "Python", "Go", "TypeScript"] },
  {
    name: "Edge & ML",
    items: ["PyTorch", "TensorRT", "Jetson", "ONNX Runtime", "ESP32", "STM32", "YOLOv8", "OpenCV"],
  },
  { name: "Agents & LLMs", items: ["LangChain", "LangGraph", "DSPy", "CrewAI", "Ollama", "Claude"] },
  { name: "ML tooling", items: ["Hugging Face", "Weights & Biases", "MLflow"] },
  { name: "Memory & RAG", items: ["Honcho", "Mem0", "Letta", "Zep", "LightRAG", "Cohere Rerank"] },
  { name: "Robotics", items: ["ROS 2", "Isaac Lab", "MuJoCo", "Zenoh", "SocketCAN", "LeRobot", "Foxglove"] },
  {
    name: "Platform & DevOps",
    items: [
      "AWS",
      "Docker",
      "Kubernetes",
      "GitHub Actions",
      "Hatchet",
      "Ray",
      "gRPC",
      "Centrifugo",
      "etcd",
      "FastAPI",
      "Pydantic",
      "uv",
    ],
  },
  { name: "Databases", items: ["PostgreSQL", "pgvector", "MongoDB", "Redis", "Neo4j", "SQLite"] },
  { name: "Web", items: ["Next.js", "React", "Astro", "Tailwind", "Vercel"] },
];

// Brand colours for logos that don't come from simple-icons, sampled from each project's
// own artwork (see the logo sources in the README).
const extraHex: Record<string, string> = {
  Zenoh: "1090f8",
  AWS: "ff9900",
  gRPC: "244b5a",
  Centrifugo: "e84c3b",
  DSPy: "ef4036",
  Hatchet: "3392ff",
  MuJoCo: "0f3693",
  Foxglove: "6f3be8",
  "Cohere Rerank": "ff7759",
  Zep: "d3479b",
  LightRAG: "e1776c",
  Mem0: "a77bff",
};

// Hover colour for a tile: the brand's own colour when it reads on both black and white,
// otherwise one of the site's R/G/B accents, picked by name so it stays stable.
export function brandColor(name: string): string {
  const hex = (iconFor(name) as { hex?: string } | undefined)?.hex ?? extraHex[name];
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 0.12 && lum < 0.85) return `#${hex}`;
  }
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return ["var(--r)", "var(--g)", "var(--b)"][sum % 3];
}
