import { WIDTH, HEIGHT, bumpers, rails, flipper } from "./game";

function segment(context, a, b, color, thickness) {
  context.strokeStyle = color;
  context.lineWidth = thickness;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}
export function drawPinball(context, game) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#191539");
  gradient.addColorStop(1, "#0b1828");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#c4b5fd44";
  for (let i = 0; i < 40; i++) {
    context.beginPath();
    context.arc(
      30 + ((i * 137) % 335),
      80 + ((i * 79) % 405),
      i % 3 === 0 ? 1.5 : 0.8,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.fillStyle = "#e9d5ff";
  context.font = "600 22px 'Segoe UI', sans-serif";
  context.textAlign = "center";
  context.fillText("PINBALL", WIDTH / 2, 90);
  context.font = "11px 'Segoe UI', sans-serif";
  context.fillStyle = "#a5b4fc";
  context.fillText("100 POINTS PER BUMPER", WIDTH / 2, 112);
  for (const [a, b] of rails) {
    segment(context, a, b, "#433c73", 12);
    segment(context, a, b, "#a78bfa", 3);
  }
  bumpers.forEach((bumper, index) => {
    const lit = game.time - (game.hits[index] ?? -1) < 0.15;
    context.fillStyle = lit ? "#fdf4ff" : "#db2777";
    context.beginPath();
    context.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#f9a8d4";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#fce7f3";
    context.font = "600 15px 'Segoe UI', sans-serif";
    context.fillText("100", bumper.x, bumper.y + 5);
  });
  for (const left of [true, false]) {
    const [a, b] = flipper(left, left ? game.leftAngle : game.rightAngle);
    segment(context, a, b, "#0e7490", 16);
    segment(context, a, b, "#67e8f9", 10);
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.arc(a.x, a.y, 5, 0, Math.PI * 2);
    context.fill();
  }
  segment(context, { x: 370, y: 618 }, { x: 395, y: 618 }, "#fbbf24", 6);
  context.strokeStyle = "#fb718533";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(185, 620);
  context.lineTo(235, 620);
  context.stroke();
  const ball = game.ball;
  const shine = context.createRadialGradient(
    ball.x - 2,
    ball.y - 3,
    1,
    ball.x,
    ball.y,
    ball.radius,
  );
  shine.addColorStop(0, "#fff");
  shine.addColorStop(1, "#94a3b8");
  context.fillStyle = shine;
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
  if (game.status === "lost") {
    context.fillStyle = "#0d1629cc";
    context.fillRect(60, 330, 300, 75);
    context.font = "600 25px 'Segoe UI', sans-serif";
    context.fillStyle = "#fff";
    context.fillText("Game over", WIDTH / 2, 375);
  }
}
