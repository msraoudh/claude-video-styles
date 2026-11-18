import { StubFx } from "./stub";
import type { ToolFx } from "./types";

export const ChefFx: ToolFx = (p) => <StubFx {...p} />;
