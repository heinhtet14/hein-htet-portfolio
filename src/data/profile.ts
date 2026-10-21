// Single source of truth for the site and for the /api/ask grounding prompt.
// Edit this file to update content; nothing else hardcodes facts about you.

export type UniverseId = "edge" | "robotics" | "ai" | "backend" | "devops" | "frontend";

export interface Universe {
  id: UniverseId;
  code: string;
  name: string;
  tagline: string;
  /** Monochrome marker shown next to this universe and on its projects. */
  glyph: string;
  stack: string[];
}

export interface Project {
  slug: string;
  title: string;
  year: string;
  universes: UniverseId[];
  summary: string;
  points: string[];
  stack: string[];
  metric?: string;
  link?: { label: string; href: string };
}

export interface Role {
  org: string;
  title: string;
  period: string;
  place: string;
  points: string[];
}

export interface Interest {
  name: string;
  line: string;
  evidence: string;
}

export const profile = {
  name: "Hein Htet",
  alias: "Jeremy",
  handle: "jer-1404",
  title: "Edge AI & Embedded ML Engineer",
  location: "Bangkok, Thailand",
  summary:
    "Engineer focused on embedded ML, edge AI and LLMs that run on-device, working across learned models and physical hardware. AI architecture lead and team co-lead at Magick Mind, building the runtime that gives robots and wearable devices an on-platform mind. Previously project lead for a 12-DOF bipedal humanoid, taking a reinforcement-learning locomotion policy from simulation onto hardware, and before that optimized and deployed deep learning models and small LLMs on the Jetson Nano.",
  contact: {
    email: "heinhtet.eie@gmail.com",
    phone: "+66 99 439 1816",
    linkedin: "https://linkedin.com/in/hein-htet-jeremy",
    github: "https://github.com/jer-1404",
  },
  education: {
    school: "King Mongkut's University of Technology Thonburi",
    degree: "B.Eng. Electronic and Infocommunication Engineering",
    period: "Graduated July 2025",
    note: "GPA 3.71/4.00 · First Class Honours",
  },
  honors: [
    "Gold Prize, Student Innovation Challenge Thailand 2024",
    "Founder, Clash of Robots: Myanmar's first national robotics competition",
    "Open-source author: Mindroid (Rust agent SDK)",
    "TOEIC 970/990",
  ],
};

export const interests: Interest[] = [
  {
    name: "Embedded ML",
    line: "Models and control loops that live on MCUs and small boards, inside a power and memory budget.",
    evidence: "ESP32 · STM32 · Jetson · dependency-free C",
  },
  {
    name: "Edge AI",
    line: "Pruning, quantization, distillation and TensorRT: making a network fit the hardware instead of the other way round.",
    evidence: "up to 18× faster on Jetson Nano",
  },
  {
    name: "Edge LLMs",
    line: "Small language models and agent runtimes that run where the device is, not only in a data centre.",
    evidence: "Qwen2.5-0.5B · TinyLlama-1.1B on device · Mindroid edge builds",
  },
];

export const universes: Universe[] = [
  {
    id: "edge",
    code: "U-01",
    name: "Edge AI & Embedded",
    tagline: "Models that fit the hardware.",
    glyph: "▣",
    stack: ["TensorRT", "ONNX Runtime", "TorchScript", "Quantization", "Pruning", "Jetson", "ESP32", "STM32", "OpenCV", "C"],
  },
  {
    id: "robotics",
    code: "U-02",
    name: "Robotics",
    tagline: "Policies that leave the simulator and walk.",
    glyph: "◆",
    stack: ["Isaac Lab", "MuJoCo", "ROS 2", "Zenoh", "SocketCAN", "IMU", "LiDAR"],
  },
  {
    id: "ai",
    code: "U-03",
    name: "AI Systems",
    tagline: "Agent runtimes, memory, voice and learned models.",
    glyph: "●",
    stack: ["PyTorch", "RL", "LangChain", "LangGraph", "DSPy", "CrewAI", "Hugging Face", "W&B", "MLflow", "Honcho", "Mem0", "Letta", "Zep", "LightRAG", "Real-time voice", "Long-term memory"],
  },
  {
    id: "backend",
    code: "U-04",
    name: "Backend",
    tagline: "Services that hold identity, state and streams.",
    glyph: "■",
    stack: ["Rust", "Go", "Python", "gRPC", "Centrifugo", "etcd", "FastAPI", "Pydantic", "PostgreSQL", "pgvector", "MongoDB", "Redis", "Neo4j", "SQLite"],
  },
  {
    id: "devops",
    code: "U-05",
    name: "DevOps",
    tagline: "Shipping to clusters and to bare metal on a robot.",
    glyph: "▲",
    stack: ["AWS", "Kubernetes", "Docker", "Hatchet", "Ray", "GitHub Actions", "uv", "systemd", "Foxglove", "Git"],
  },
  {
    id: "frontend",
    code: "U-06",
    name: "Frontend",
    tagline: "Interfaces for humans in the loop.",
    glyph: "○",
    stack: ["TypeScript", "Next.js", "React", "Astro"],
  },
];

export const projects: Project[] = [
  {
    slug: "edge-dl",
    title: "Deep Learning & LLMs on Jetson Nano",
    year: "2025",
    universes: ["edge", "ai"],
    summary:
      "A complete optimization and deployment pipeline for the NVIDIA Jetson Nano, tested on five CNN families, real-time vision apps and small LLMs.",
    points: [
      "Structured and unstructured pruning, PTQ and QAT quantization, knowledge distillation, SVD low-rank",
      "TensorRT acceleration across VGG, MobileNetV2, EfficientNet, NASNet and AlexNet",
      "Benchmarked Qwen2.5-0.5B and TinyLlama-1.1B on device for memory and latency",
      "Real-time YOLOv8s detection, MobileNet-SSD and face recognition on the board",
    ],
    stack: ["PyTorch", "TensorRT", "ONNX", "Jetson Nano"],
    metric: "up to 18× speedup",
  },
  {
    slug: "mindroid",
    title: "Mindroid",
    year: "2026",
    universes: ["edge", "ai", "backend"],
    summary:
      "Open-source Rust agent SDK. Every subsystem (transport, pipeline, auth, memory, observer) is a trait, and feature-gated builds let the same runtime run in the cloud or on constrained edge hardware.",
    points: [
      "Composable pipeline stages: context builder, gate, LLM, tool executor, post-processor",
      "Works with any OpenAI-compatible endpoint, including local model servers",
      "Skill system with deterministic prefiltering and trust-based authority",
      "Transports for stdio, WebSocket and live audio",
    ],
    stack: ["Rust", "Tokio", "OpenAI-compatible LLMs", "Gemini Live"],
    link: { label: "github.com/General-Magick-Industries/mindroid", href: "https://github.com/General-Magick-Industries/mindroid" },
  },
  {
    slug: "tet-hlan-rl",
    title: "Tet Hlan: Humanoid Locomotion",
    year: "2025",
    universes: ["robotics", "edge", "ai"],
    summary:
      "Designed the observation and action spaces for a 12-DOF bipedal humanoid and took its reinforcement-learning walking policy from simulation onto the robot's own hardware.",
    points: [
      "Isaac Lab tasks and terrains, trained with RSL-RL",
      "Domain randomization of joint stiffness and damping",
      "Sim-to-sim check in MuJoCo before sim-to-real",
      "LiDAR-aware walking gait",
    ],
    stack: ["Isaac Lab", "PyTorch", "RSL-RL", "MuJoCo", "TorchScript"],
    metric: "50 Hz on hardware",
  },
  {
    slug: "tet-hlan-ros",
    title: "Tet Hlan: Real-time Control Stack",
    year: "2025",
    universes: ["robotics", "edge", "devops"],
    summary: "The real-time sensing and motor-control stack beneath the policy, after migrating the platform to ROS 2.",
    points: [
      "SocketCAN motor drivers in MIT mode for every actuator",
      "IMU, joystick and RL-policy nodes under one launch file",
      "System-monitor daemon running as a systemd service, with Foxglove for live telemetry",
    ],
    stack: ["ROS 2", "C++", "Python", "SocketCAN", "Foxglove", "systemd"],
  },
  {
    slug: "orb-slam",
    title: "ORB-SLAM2 for Constrained Compute",
    year: "2024",
    universes: ["edge", "robotics"],
    summary:
      "Rewrote ORB-SLAM2 for robot-class compute, implementing its numerical and bundle-adjustment libraries from scratch.",
    points: ["Ported a visual localization pipeline to dependency-free C"],
    stack: ["C", "C++", "Visual SLAM"],
  },
  {
    slug: "satellite-fw",
    title: "Satellite Firmware",
    year: "2022",
    universes: ["edge"],
    summary: "Firmware across five STM32 architectures, including an ion-thruster control subsystem.",
    points: [],
    stack: ["C", "STM32", "Embedded"],
  },
  {
    slug: "voice-runtime",
    title: "Real-time Voice Runtime for Devices",
    year: "2026",
    universes: ["ai", "backend", "devops"],
    summary:
      "The runtime that gives ESP32-class robots and wearables an on-platform mind: streaming speech in, persona-driven reasoning, speech out, with barge-in.",
    points: [
      "Bidirectional gRPC stream proxied per device subscription",
      "VAD → speech-to-text → persona/LLM → text-to-speech, with interruption handling",
      "Each subscription authorized against the platform gateway",
    ],
    stack: ["Rust", "gRPC", "Centrifugo", "Silero VAD", "Kubernetes"],
    metric: "50 concurrent sessions",
  },
  {
    slug: "fc-robot",
    title: "LLM → Robotics Adapter",
    year: "2026",
    universes: ["robotics", "ai"],
    summary:
      "Exposes robot capabilities as agent tools so a platform agent can run missions on a quadruped companion and a robotic arm. The LLM only selects capabilities; execution and safety stay deterministic on the robot.",
    points: [
      "Two processes over a single owned gRPC contract, generated on both sides",
      "Rust agent node built on Mindroid capability tools; Python robot node with a mission state machine",
      "MuJoCo simulation, then a real SO-ARM101: greet, nod, wave, and pick up a 'HELLO' card",
      "Zenoh transport for the robot side; in development, validated in simulation",
    ],
    stack: ["Rust", "Python", "gRPC", "Zenoh", "MuJoCo", "LeRobot"],
  },
  {
    slug: "token-broker",
    title: "Device Pairing & Token Broker",
    year: "2026",
    universes: ["backend", "devops"],
    summary:
      "Control plane for a companion app and its robots. Binds each device to its own persona-backed agent identity and keeps tenant credentials off the hardware.",
    points: [
      "Consumer auth, paired-device lookup and short-lived end-user token issuance",
      "CLI robot pairing flow; no audio or chat content ever touches it",
      "Postgres-only storage, deploy config and a mobile-team handover with data-flow diagrams",
    ],
    stack: ["Python", "FastAPI", "Postgres", "JWT", "Docker"],
  },
  {
    slug: "agent-memory",
    title: "Agent Memory & Recall",
    year: "2026",
    universes: ["ai", "backend", "devops"],
    summary:
      "Research and production work on long-term memory for companion agents: what an agent remembers about the people it talks to, and keeping that service reliable.",
    points: [
      "Compared Honcho, Letta, Mem0 and Zep by who the memory is about: any peer, the agent, or the user",
      "Peer-recall prototype on Honcho, testing whether memory keeps a peer's facts or drifts to stereotype; Obsidian export of the memory graph",
      "Redis Cluster cross-slot fix by hash-tagging co-accessed keys",
      "Native MongoDB-AWS credential refresh to stop failures after idle reconnects",
    ],
    stack: ["Python", "Honcho", "Letta", "Mem0", "Zep", "Redis Cluster", "MongoDB", "Embeddings"],
  },
  {
    slug: "memory-eval",
    title: "Memory Evaluation Framework",
    year: "2026",
    universes: ["ai"],
    summary:
      "An evaluation design for agent memory that asks four things separately: was it stored, was it retrieved, did it improve the answer, and which stage failed when it didn't.",
    points: [
      "LongMemEval_S as the primary benchmark, _M for scale, oracle arm as the ceiling; LoCoMo for vendor comparability only",
      "MemoryAgentBench FactConsolidation for knowledge-update conflicts",
      "Synthetic persona timelines as write-path gold, with planted distractors",
      "Fact coverage alongside Recall@K and NDCG, and an LLM judge kept separate from the writer",
    ],
    stack: ["Python", "LongMemEval", "LoCoMo", "LLM-as-judge"],
  },
  {
    slug: "rag-ingest",
    title: "LightRAG Ingest Pipeline",
    year: "2026",
    universes: ["ai", "backend", "devops"],
    summary:
      "The document retrieval engine behind the platform's knowledge base: LightRAG over pgvector and Neo4j, with Cohere reranking, ingesting on Hatchet workers and Ray actors.",
    points: [
      "End-to-end test coverage for the ingest pipeline on Hatchet",
      "The dev smoke test ops runs after a deploy, matched to what dev actually does",
    ],
    stack: ["LightRAG", "Hatchet", "Ray", "pgvector", "Neo4j", "Cohere Rerank", "Kubernetes"],
  },
  {
    slug: "recursive-lm",
    title: "Deterministic Recursive LM",
    year: "2026",
    universes: ["ai"],
    summary:
      "An architecture that replaces open-ended reasoning loops with a fixed combinator chain, validated against reference implementations.",
    points: ["Predictable cost and depth per query", "Evaluated across four public reasoning benchmarks"],
    stack: ["Python", "LLMs", "Evaluation"],
  },
  {
    slug: "speech-conversion",
    title: "Self-supervised Speech Conversion",
    year: "2024",
    universes: ["ai"],
    summary:
      "A generative model over learned latent representations with a neural vocoder, outperforming two published baselines.",
    points: ["Sequence models over continuous latents", "Designed the evaluation protocol used to compare them"],
    stack: ["PyTorch", "Self-supervised learning", "Vocoders"],
  },
  {
    slug: "web-console",
    title: "Platform Web Console",
    year: "2026",
    universes: ["frontend", "backend"],
    summary: "Security and product work on the developer platform's web app.",
    points: [
      "Server-side session guard and JWT validation in the proxy instead of cookie-name presence",
      "Per-user LLM spend caps on chat",
      "Pricing page flow for booking a call",
    ],
    stack: ["Next.js", "React", "TypeScript", "NextAuth", "Tailwind"],
  },
  {
    slug: "portfolio",
    title: "This Site",
    year: "2026",
    universes: ["frontend", "ai", "devops"],
    summary:
      "Static Astro with one serverless function: the terminal's `ask` answers questions about me, grounded only in this site's data.",
    points: ["No UI framework, keyboard-first terminal", "Rate-limited Gemini endpoint, no chat history stored"],
    stack: ["Astro", "TypeScript", "Vercel", "Gemini API"],
  },
];

export const roles: Role[] = [
  {
    org: "Magick Mind",
    title: "AI Architecture Lead & Team Co-Lead",
    period: "Apr 2026 – Present",
    place: "Bangkok",
    points: [
      "Lead AI architecture across a 17-service platform: companion agents, memory, voice and robotics",
      "Built the real-time voice runtime for ESP32-class robots and wearables",
      "Architected Mindroid, an open-source Rust agent SDK that also builds for edge hardware",
      "Designed device pairing and token-broker architecture",
    ],
  },
  {
    org: "Magick Robotics",
    title: "Project Lead & Senior Robotics Engineer",
    period: "Mar 2025 – Mar 2026",
    place: "Bangkok",
    points: [
      "Took the Tet Hlan humanoid's RL locomotion policy from sim to hardware at 50 Hz",
      "Led software architecture across embedded, RL locomotion and mechanical integration",
    ],
  },
  {
    org: "KMUTT Deep Learning Lab",
    title: "Research Assistant",
    period: "Aug 2022 – Jun 2025",
    place: "Bangkok",
    points: ["Self-supervised generative speech conversion; sequence models over learned latents"],
  },
  {
    org: "Panasonic Research Lab",
    title: "Student Researcher",
    period: "Oct 2023 – Jul 2024",
    place: "Singapore",
    points: ["Rewrote ORB-SLAM2 for constrained robot compute, in dependency-free C"],
  },
  {
    org: "Mu Space Corp",
    title: "Embedded Engineering Intern",
    period: "Feb 2022 – Jul 2022",
    place: "Bangkok",
    points: ["Satellite firmware across five STM32 architectures"],
  },
];

/** Plain-text dossier used as the grounding context for /api/ask. */
export function dossier(): string {
  const p = profile;
  const lines = [
    `${p.name} (${p.alias}), ${p.title}, ${p.location}.`,
    p.summary,
    `Main interests: ${interests.map((i) => `${i.name} (${i.line})`).join("; ")}.`,
    `Education: ${p.education.degree}, ${p.education.school}, ${p.education.period}. ${p.education.note}.`,
    `Contact: ${p.contact.email} · ${p.contact.linkedin} · ${p.contact.github}`,
    `Honors: ${p.honors.join("; ")}.`,
    "",
    "EXPERIENCE",
    ...roles.map((r) => `- ${r.title}, ${r.org} (${r.period}, ${r.place}): ${r.points.join("; ")}.`),
    "",
    "PROJECTS",
    ...projects.map(
      (x) =>
        `- ${x.title} (${x.year}; ${x.universes.join(", ")}): ${x.summary} ${x.points.join("; ")}.` +
        ` Stack: ${x.stack.join(", ")}.${x.metric ? ` Result: ${x.metric}.` : ""}`,
    ),
    "",
    "SKILLS BY AREA",
    ...universes.map((u) => `- ${u.name}: ${u.stack.join(", ")}`),
  ];
  return lines.join("\n");
}
