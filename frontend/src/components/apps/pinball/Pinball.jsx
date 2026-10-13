import { ArcadeGame } from "../shared/ArcadeGame";
import {
  createPinball,
  launchPinball,
  stepPinball,
  WIDTH,
  HEIGHT,
} from "./game";
import { drawPinball } from "./draw";

export function Pinball({ active = true }) {
  return (
    <ArcadeGame
      active={active}
      title="Pinball"
      width={WIDTH}
      height={HEIGHT}
      create={createPinball}
      advance={stepPinball}
      launch={launchPinball}
      draw={drawPinball}
    />
  );
}
