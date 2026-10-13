import { bounceSegment, clamp } from "../shared/physics";

export const WIDTH = 420;
export const HEIGHT = 640;
export const bumpers = [
  { x: 140, y: 180, radius: 26 },
  { x: 270, y: 180, radius: 26 },
  { x: 205, y: 270, radius: 30 },
];
export const rails = [
  [
    { x: 25, y: 100 },
    { x: 80, y: 40 },
  ],
  [
    { x: 80, y: 40 },
    { x: 340, y: 40 },
  ],
  [
    { x: 340, y: 40 },
    { x: 405, y: 100 },
  ],
  [
    { x: 25, y: 100 },
    { x: 25, y: 520 },
  ],
  [
    { x: 405, y: 100 },
    { x: 405, y: 640 },
  ],
  [
    { x: 362, y: 300 },
    { x: 362, y: 640 },
  ],
  [
    { x: 25, y: 370 },
    { x: 80, y: 490 },
  ],
  [
    { x: 362, y: 370 },
    { x: 320, y: 490 },
  ],
  [
    { x: 80, y: 490 },
    { x: 120, y: 530 },
  ],
  [
    { x: 320, y: 490 },
    { x: 280, y: 530 },
  ],
];

const plungerBall = () => ({ x: 383, y: 600, radius: 7, vx: -15, vy: -920 });
export function createPinball() {
  return {
    ball: plungerBall(),
    score: 0,
    lives: 3,
    status: "ready",
    time: 0,
    hits: {},
    leftAngle: 0.35,
    rightAngle: Math.PI - 0.35,
  };
}
export function launchPinball(game) {
  return game.status === "ready"
    ? { ...game, ball: plungerBall(), status: "playing" }
    : game;
}
export function flipper(left, angle) {
  const start = { x: left ? 120 : 280, y: 545 };
  return [
    start,
    { x: start.x + Math.cos(angle) * 67, y: start.y + Math.sin(angle) * 67 },
  ];
}
function approach(angle, target, dt) {
  return angle + clamp(target - angle, -9 * dt, 9 * dt);
}

export function stepPinball(game, input, seconds) {
  if (!["ready", "playing"].includes(game.status)) return game;
  const dt = clamp(seconds, 0, 0.032);
  const next = {
    ...game,
    ball: { ...game.ball },
    hits: { ...game.hits },
    time: game.time + dt,
  };
  next.leftAngle = approach(game.leftAngle, input.left ? -0.5 : 0.35, dt);
  next.rightAngle = approach(
    game.rightAngle,
    input.right ? Math.PI + 0.5 : Math.PI - 0.35,
    dt,
  );
  if (game.status === "ready") return next;
  const steps = Math.max(1, Math.ceil(dt / 0.006));
  for (let step = 0; step < steps; step++) {
    const ball = next.ball;
    ball.vy += (580 * dt) / steps;
    ball.x += (ball.vx * dt) / steps;
    ball.y += (ball.vy * dt) / steps;
    for (const [a, b] of rails) bounceSegment(ball, a, b, 3);
    bumpers.forEach((bumper, index) => {
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= ball.radius + bumper.radius || distance === 0) return;
      const nx = dx / distance;
      const ny = dy / distance;
      ball.x = bumper.x + nx * (ball.radius + bumper.radius + 0.2);
      ball.y = bumper.y + ny * (ball.radius + bumper.radius + 0.2);
      if (ball.vx * nx + ball.vy * ny < 0) {
        ball.vx = nx * 650;
        ball.vy = ny * 650;
        if (next.time - (next.hits[index] ?? -1) > 0.15) {
          next.score += 100;
          next.hits[index] = next.time;
        }
      }
    });
    for (const left of [true, false]) {
      const segment = flipper(left, left ? next.leftAngle : next.rightAngle);
      if (
        bounceSegment(ball, ...segment, 6, 0.82) &&
        (left ? input.left : input.right)
      ) {
        ball.vx += left ? 170 : -170;
        ball.vy = Math.min(ball.vy, -620);
      }
    }
    if (ball.x < 7) {
      ball.x = 7;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x > WIDTH - 7) {
      ball.x = WIDTH - 7;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y < 7) {
      ball.y = 7;
      ball.vy = Math.abs(ball.vy);
    }
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 1300) {
      ball.vx *= 1300 / speed;
      ball.vy *= 1300 / speed;
    }
    if (ball.y > HEIGHT + ball.radius) {
      next.lives--;
      next.status = next.lives ? "ready" : "lost";
      next.ball = plungerBall();
      break;
    }
  }
  return next;
}
