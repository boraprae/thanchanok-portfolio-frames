import "./index.css";
import { Composition } from "remotion";
import { PEAR_TEASER_DURATION, PearTeaser } from "./PearTeaser";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PearTeaser"
        component={PearTeaser}
        durationInFrames={PEAR_TEASER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
