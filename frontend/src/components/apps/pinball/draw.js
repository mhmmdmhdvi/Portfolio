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
  gradient.addColorStop(0, "#1b304d");
  gradient.addColorStop(1, "#101a2b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#aabed8";
  context.font = "600 16px 'Segoe UI', sans-serif";
  context.textAlign = "center";
  context.fillText("PINBALL", WIDTH / 2, 86);
  context.font = "11px 'Segoe UI', sans-serif";
  context.fillStyle = "#7d95b2";
  context.fillText("100 points per bumper", WIDTH / 2, 106);
  for (const [a, b] of rails) {
    segment(context, a, b, "#3b526c", 12);
    segment(context, a, b, "#b3c4d6", 3);
  }
  bumpers.forEach((bumper, index) => {
    const lit = game.time - (game.hits[index] ?? -1) < 0.15;
    const face = context.createRadialGradient(
      bumper.x - 8, bumper.y - 10, 1, bumper.x, bumper.y, bumper.radius,
    );
    face.addColorStop(0, lit ? "#ffffff" : "#9abfff");
    face.addColorStop(1, lit ? "#a7d9ff" : "#346bba");
    context.fillStyle = face;
    context.beginPath();
    context.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = lit ? "#e1f4ff" : "#c2d5eb";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#f3f7ff";
    context.font = "600 15px 'Segoe UI', sans-serif";
    context.fillText("100", bumper.x, bumper.y + 5);
  });
  for (const left of [true, false]) {
    const [a, b] = flipper(left, left ? game.leftAngle : game.rightAngle);
    segment(context, a, b, "#476589", 16);
    segment(context, a, b, "#cfdeec", 10);
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.arc(a.x, a.y, 5, 0, Math.PI * 2);
    context.fill();
  }
  segment(context, { x: 370, y: 618 }, { x: 395, y: 618 }, "#e8bc76", 6);
  context.strokeStyle = "#e8bc7655";
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
    context.fillStyle = "#101a2bdd";
    context.fillRect(60, 330, 300, 75);
    context.font = "600 25px 'Segoe UI', sans-serif";
    context.fillStyle = "#fff";
    context.fillText("Game over", WIDTH / 2, 375);
  }
}
