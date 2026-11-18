import { StubFx } from "./stub";
import type { ToolFx } from "./types";

export const LoopFx: ToolFx = (p) => <StubFx {...p} />;
