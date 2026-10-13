export const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

export function bounceRectangle(ball, rectangle) {
  let x = clamp(ball.x, rectangle.x, rectangle.x + rectangle.width);
  let y = clamp(ball.y, rectangle.y, rectangle.y + rectangle.height);
  let dx = ball.x - x;
  let dy = ball.y - y;
  let distance = Math.hypot(dx, dy);
  if (distance >= ball.radius) return false;
  if (distance === 0) {
    const sides = [
      { distance: ball.x - rectangle.x, nx: -1, ny: 0 },
      { distance: rectangle.x + rectangle.width - ball.x, nx: 1, ny: 0 },
      { distance: ball.y - rectangle.y, nx: 0, ny: -1 },
      { distance: rectangle.y + rectangle.height - ball.y, nx: 0, ny: 1 },
    ].sort((a, b) => a.distance - b.distance);
    dx = sides[0].nx;
    dy = sides[0].ny;
    distance = 1;
    x = ball.x + dx * sides[0].distance;
    y = ball.y + dy * sides[0].distance;
  }
  const nx = dx / distance;
  const ny = dy / distance;
  ball.x = x + nx * (ball.radius + 0.1);
  ball.y = y + ny * (ball.radius + 0.1);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
  }
  return true;
}

export function bounceSegment(ball, a, b, thickness = 0, restitution = 0.9) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = clamp(
    ((ball.x - a.x) * dx + (ball.y - a.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  const x = a.x + dx * t;
  const y = a.y + dy * t;
  const distance = Math.hypot(ball.x - x, ball.y - y);
  if (distance >= ball.radius + thickness || distance === 0) return false;
  const nx = (ball.x - x) / distance;
  const ny = (ball.y - y) / distance;
  ball.x = x + nx * (ball.radius + thickness + 0.1);
  ball.y = y + ny * (ball.radius + thickness + 0.1);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx -= (1 + restitution) * dot * nx;
    ball.vy -= (1 + restitution) * dot * ny;
  }
  return true;
}
