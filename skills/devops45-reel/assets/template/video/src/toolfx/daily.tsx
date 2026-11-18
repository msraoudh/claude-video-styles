import { StubFx } from "./stub";
import type { ToolFx } from "./types";

export const DailyFx: ToolFx = (p) => <StubFx {...p} />;
