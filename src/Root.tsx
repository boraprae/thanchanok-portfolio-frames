import "./index.css";
import { Composition } from "remotion";
import { PearTeaser } from "./PearTeaser";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PearTeaser"
        component={PearTeaser}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
