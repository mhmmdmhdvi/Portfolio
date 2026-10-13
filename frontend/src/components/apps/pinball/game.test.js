import { describe, expect, it } from "vitest";
import { createPinball, launchPinball, stepPinball, HEIGHT } from "./game";

describe("Pinball physics", () => {
  it("starts with three balls and launches from the plunger", () => {
    const game = createPinball();
    expect(game.status).toBe("ready");
    expect(game.lives).toBe(3);
    const next = launchPinball(game);
    expect(next.status).toBe("playing");
    expect(next.ball.vy).toBeLessThan(-800);
    expect(game.status).toBe("ready");
  });
  it("adds gravity without mutating the previous state", () => {
    const game = launchPinball(createPinball());
    game.ball = { ...game.ball, x: 80, y: 250, vx: 0, vy: 0 };
    const next = stepPinball(game, {}, 0.02);
    expect(next.ball.vy).toBeGreaterThan(0);
    expect(game.ball.vy).toBe(0);
  });
  it("kicks the ball away from a bumper and scores once per contact", () => {
    const game = launchPinball(createPinball());
    game.ball = { ...game.ball, x: 140, y: 146, vx: 0, vy: 200 };
    const next = stepPinball(game, {}, 0.03);
    expect(next.score).toBe(100);
    expect(next.ball.vy).toBeLessThan(0);
  });
  it("raises the left flipper when pressed", () => {
    const game = launchPinball(createPinball());
    expect(stepPinball(game, { left: true }, 0.03).leftAngle).toBeLessThan(
      game.leftAngle,
    );
  });
  it("drains one ball, then ends the game on the final ball", () => {
    const game = launchPinball(createPinball());
    game.ball.y = HEIGHT + 20;
    expect(stepPinball(game, {}, 0.01).lives).toBe(2);
    expect(stepPinball(game, {}, 0.01).status).toBe("ready");
    game.lives = 1;
    expect(stepPinball(game, {}, 0.01).status).toBe("lost");
  });
});
