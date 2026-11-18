import type React from "react";
import { Placeholder } from "./Placeholder";

/**
 * Part id (trailer.json parts[].id) -> the section agent's component. Each agent builds its part in
 * src/sections/<id>/ (index.tsx exports the component) and the director registers it here, e.g.
 *   import { Hero } from "./hero";
 *   const REGISTRY = { hero: Hero };
 * A part with no component yet renders the Placeholder (beat grid + its lines), so the trailer always renders.
 */
const REGISTRY: Record<string, React.FC> = {};

export const partComponent = (id: string): React.FC => REGISTRY[id] ?? Placeholder;
