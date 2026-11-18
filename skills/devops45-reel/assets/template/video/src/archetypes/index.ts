import type React from "react";
import type { SceneSpec } from "../data/episode";
import { CUSTOM } from "../scenes";
import { Placeholder } from "./Placeholder";
import { Title } from "./title";
import { Hook } from "./hook";
import { Cta } from "./cta";
import { Terminal } from "./terminal";
import { Code } from "./code";
import { Steps } from "./steps";
import { Cards } from "./cards";
import { Compare } from "./compare";
import { Myth } from "./myth";
import { Analogy } from "./analogy";
import { Flow } from "./flow";
import { Stat } from "./stat";
import { Incident } from "./incident";
import { Tool } from "./tool";

export type ArchetypeProps = { spec: SceneSpec };
export type Archetype = React.FC<ArchetypeProps>;

/**
 * type → component. Each archetype lives in its own folder (src/archetypes/<type>/index.tsx) and exports
 * `export const <Name>: Archetype`. Add it here when it exists; missing types render the Placeholder.
 */
export const REGISTRY: Record<string, Archetype> = {
  title: Title,
  hook: Hook,
  cta: Cta,
  terminal: Terminal,
  code: Code,
  steps: Steps,
  cards: Cards,
  compare: Compare,
  myth: Myth,
  analogy: Analogy,
  flow: Flow,
  stat: Stat,
  incident: Incident,
  tool: Tool,
};

export const componentFor = (spec: SceneSpec): Archetype => {
  if (spec.type === "custom") return CUSTOM[spec.data?.component] ?? Placeholder;
  return REGISTRY[spec.type] ?? Placeholder;
};
