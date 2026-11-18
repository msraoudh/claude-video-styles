import type React from "react";
import type { SceneSpec } from "../data/episode";

/**
 * Custom scenes for THIS episode only (type "custom", data.component = key below). Use them only when no archetype
 * can show the idea; build them from the kit + lib/look.ts so they keep the series look.
 *   import { Rollout } from "./rollout";   →   export const CUSTOM = { rollout: Rollout };
 */
export const CUSTOM: Record<string, React.FC<{ spec: SceneSpec }>> = {};
