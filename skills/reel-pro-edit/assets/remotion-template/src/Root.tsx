import { Composition } from "remotion";
import { Reel } from "./Reel";
import { CinematicLab } from "./cinematic";
import { sec } from "./lib/motion";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Reel" component={Reel} durationInFrames={1798} fps={30} width={1080} height={1920} />
      <Composition
        id="CinematicLab"
        component={CinematicLab}
        durationInFrames={sec(64.3)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ footage: "footage/cut-v4.mp4", showLayer: true, basePlate: true }}
      />
    </>
  );
};
