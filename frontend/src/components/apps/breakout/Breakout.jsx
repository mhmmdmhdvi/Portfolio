import { ArcadeGame } from "../shared/ArcadeGame";
import {
  createBreakout,
  launchBreakout,
  stepBreakout,
  WIDTH,
  HEIGHT,
} from "./game";
import { drawBreakout } from "./draw";

export function Breakout({ active = true }) {
  return (
    <ArcadeGame
      active={active}
      title="Breakout"
      width={WIDTH}
      height={HEIGHT}
      create={createBreakout}
      advance={stepBreakout}
      launch={launchBreakout}
      draw={drawBreakout}
      paddle
    />
  );
}
