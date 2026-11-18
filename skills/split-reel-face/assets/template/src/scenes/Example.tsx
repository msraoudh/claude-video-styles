import type React from "react";
import { Sequence } from "remotion";
import type { Cue } from "../edit/cue";
import { Card, Chip, enter, Thumb, Title, useIn } from "../edit/kit";
import { L } from "../edit/theme";
import { f, wf } from "../edit/time";

/**
 * Pattern for a scene (delete once the real scenes exist). GLOBAL frames: useIn(at) gives the house entrance,
 * wf("word", approxSec) lands an element ON its spoken word. Stage area in split mode: y L.contentTop–L.contentBottom.
 */
const FROM = f(0);
const TO = f(4);
export const Example: React.FC = () => {
  const a = useIn(FROM + 4, 7, TO - 8);
  const b = useIn(wf("Claude", 2), 7, TO - 8);
  if (a.frame < FROM - 10 || a.frame > TO + 10) return null;
  return (
    <>
      <div style={{ position: "absolute", left: L.side, right: L.side, top: L.contentTop, ...enter(a.p, a.q) }}>
        <Card>
          <Title parts={[["Example "], ["scene", true]]} size={52} />
        </Card>
      </div>
      <div style={{ position: "absolute", left: L.side, top: L.contentTop + 200, ...enter(b.p, b.q) }}>
        <Chip accent>on the word « Claude »</Chip>
      </div>
      <Sequence from={FROM} durationInFrames={TO - FROM} layout="none">
        <div style={{ position: "absolute", right: L.side + 80, top: L.contentTop + 20 }}>
          <Thumb name="example-1" w={120} />
        </div>
      </Sequence>
    </>
  );
};
export const exampleCues: Cue[] = [{ f: FROM + 4, sfx: "whoosh", vol: 0.3, note: "example in" }];
