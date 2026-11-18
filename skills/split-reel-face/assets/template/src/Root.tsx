import { Composition, Folder } from "remotion";
import { CoverStill } from "./CoverStill";
import { EditReel } from "./EditReel";
import { DURATION } from "./edit/time";
import { SCENE_LIST } from "./scenes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* the reel — preview in Studio; render ONLY when the user says so */}
      <Composition id="Reel" component={EditReel} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ sound: true, captions: true }} />
      {/* Instagram cover (still) */}
      <Composition id="CoverIG" component={CoverStill} durationInFrames={1} fps={30} width={1080} height={1920} />
      {/* QA: one scene alone on the global timeline (silent), for stills */}
      <Folder name="Scenes">
        {SCENE_LIST.map((s) => (
          <Composition key={s.id} id={`Scene-${s.id}`} component={EditReel} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ sound: false, captions: true, only: s.id }} />
        ))}
      </Folder>
    </>
  );
};
