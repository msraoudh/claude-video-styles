import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { CLEAN_TOTAL, CleanCut } from "./CleanCut";
import { DURATION } from "./lib/time";
import { Reel } from "./Reel";
import { Showcase } from "./Showcase";

export const RemotionRoot: React.FC = () => (
  <>
    {/* THE REEL (the deliverable): his edit in a card on the red→black canvas + the pen storyboard card. Render only on his OK. */}
    <Still id="Cover" component={Cover} width={1080} height={1920} />
    <Composition id="Showcase" component={Showcase} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ sound: true }} />
    {/* the same edit full screen, without the card (variant; Showcase is what he posts) */}
    <Composition id="Reel" component={Reel} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ sound: true, captions: true }} />
    {/* the approved clean cut alone */}
    <Composition id="CleanCut" component={CleanCut} durationInFrames={CLEAN_TOTAL} fps={30} width={1080} height={1920} defaultProps={{ labels: true }} />
  </>
);
