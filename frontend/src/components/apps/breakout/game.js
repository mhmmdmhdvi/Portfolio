import { bounceRectangle, clamp } from "../shared/physics";

export const WIDTH = 600;
export const HEIGHT = 420;

function readyBall(paddle) {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - 9,
    radius: 7,
    vx: 180,
    vy: -260,
  };
}

export function createBreakout() {
  const paddle = { x: 252, y: HEIGHT - 36, width: 96, height: 12 };
  const width = (WIDTH - 48 - 7 * 6) / 8;
  return {
    paddle,
    ball: readyBall(paddle),
    score: 0,
    lives: 3,
    status: "ready",
    bricks: Array.from({ length: 40 }, (_, index) => ({
      x: 24 + (index % 8) * (width + 6),
      y: 45 + Math.floor(index / 8) * 28,
      width,
      height: 20,
      row: Math.floor(index / 8),
      alive: true,
    })),
  };
}

export function launchBreakout(game) {
  return game.status === "ready"
    ? { ...game, ball: { ...game.ball }, status: "playing" }
    : game;
}

export function stepBreakout(game, input, seconds) {
  if (!["ready", "playing"].includes(game.status)) return game;
  const dt = clamp(seconds, 0, 0.032);
  const paddle = { ...game.paddle };
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  paddle.x = clamp(paddle.x + direction * 520 * dt, 0, WIDTH - paddle.width);
  if (Number.isFinite(input.pointerX))
    paddle.x = clamp(
      input.pointerX - paddle.width / 2,
      0,
      WIDTH - paddle.width,
    );
  const next = {
    ...game,
    paddle,
    ball: { ...game.ball },
    bricks: game.bricks.map((brick) => ({ ...brick })),
  };
  if (game.status === "ready") {
    next.ball = readyBall(paddle);
    return next;
  }
  const steps = Math.max(1, Math.ceil(dt / 0.008));
  for (let step = 0; step < steps; step++) {
    const ball = next.ball;
    ball.x += (ball.vx * dt) / steps;
    ball.y += (ball.vy * dt) / steps;
    if (ball.x < ball.radius) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x > WIDTH - ball.radius) {
      ball.x = WIDTH - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y < ball.radius) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
    const falling = ball.vy > 0;
    if (falling && bounceRectangle(ball, paddle)) {
      const offset = clamp(
        (ball.x - paddle.x - paddle.width / 2) / (paddle.width / 2),
        -1,
        1,
      );
      const speed = Math.min(500, Math.hypot(ball.vx, ball.vy) + 5);
      ball.vx = Math.sin(offset * 1.05) * speed;
      ball.vy = -Math.cos(offset * 1.05) * speed;
    }
    for (const brick of next.bricks) {
      if (brick.alive && bounceRectangle(ball, brick)) {
        brick.alive = false;
        next.score += 10;
        if (next.bricks.every((item) => !item.alive)) next.status = "won";
        break;
      }
    }
    if (ball.y > HEIGHT + ball.radius) {
      next.lives--;
      next.status = next.lives ? "ready" : "lost";
      next.ball = readyBall(paddle);
    }
    if (next.status !== "playing") break;
  }
  return next;
}
