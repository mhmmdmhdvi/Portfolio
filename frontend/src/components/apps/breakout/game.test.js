import { describe, expect, it } from "vitest";
import {
  createBreakout,
  launchBreakout,
  stepBreakout,
  WIDTH,
  HEIGHT,
} from "./game";

describe("Breakout rules", () => {
  it("creates a ready game with forty bricks and three lives", () => {
    const game = createBreakout();
    expect(game.status).toBe("ready");
    expect(game.bricks).toHaveLength(40);
    expect(game.lives).toBe(3);
  });
  it("keeps the paddle and ready ball within the board", () => {
    const game = stepBreakout(
      createBreakout(),
      { pointerX: WIDTH + 100 },
      0.02,
    );
    expect(game.paddle.x + game.paddle.width).toBeLessThanOrEqual(WIDTH);
    expect(game.ball.x).toBeLessThan(WIDTH);
  });
  it("reflects a ball at the side wall", () => {
    const game = launchBreakout(createBreakout());
    game.ball = { ...game.ball, x: 8, y: 250, vx: -300, vy: 0 };
    const next = stepBreakout(game, {}, 0.02);
    expect(next.ball.vx).toBeGreaterThan(0);
    expect(next.ball.x).toBeGreaterThanOrEqual(next.ball.radius);
  });
  it("removes a hit brick, scores once, and wins after the last brick", () => {
    const game = launchBreakout(createBreakout());
    game.bricks = [{ x: 100, y: 100, width: 60, height: 20, alive: true }];
    game.ball = { ...game.ball, x: 120, y: 90, vx: 0, vy: 200 };
    const next = stepBreakout(game, {}, 0.03);
    expect(next.score).toBe(10);
    expect(next.bricks[0].alive).toBe(false);
    expect(next.status).toBe("won");
    expect(game.bricks[0].alive).toBe(true);
  });
  it("uses one life and becomes ready to relaunch after a miss", () => {
    const game = launchBreakout(createBreakout());
    game.ball.y = HEIGHT + 20;
    const next = stepBreakout(game, {}, 0.01);
    expect(next.lives).toBe(2);
    expect(next.status).toBe("ready");
    game.lives = 1;
    expect(stepBreakout(game, {}, 0.01).status).toBe("lost");
  });
});
