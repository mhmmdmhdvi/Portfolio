import { WIDTH, HEIGHT } from "./game";

const colors = ["#f472b6", "#c084fc", "#60a5fa", "#2dd4bf", "#fbbf24"];
export function drawBreakout(context, game) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#0d1629";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = "#182641";
  context.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 30) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, HEIGHT);
    context.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 30) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WIDTH, y);
    context.stroke();
  }
  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    context.fillStyle = colors[brick.row ?? 0];
    context.beginPath();
    context.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
    context.fill();
    context.fillStyle = "#ffffff33";
    context.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
  }
  const paddle = game.paddle;
  context.fillStyle = "#f1f5f9";
  context.beginPath();
  context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
  context.fill();
  context.fillStyle = "#38bdf8";
  context.fillRect(paddle.x + 8, paddle.y + 3, paddle.width - 16, 3);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
  context.fill();
  if (["won", "lost"].includes(game.status)) {
    context.fillStyle = "#0d1629cc";
    context.fillRect(0, 190, WIDTH, 90);
    context.fillStyle = "#f8fafc";
    context.textAlign = "center";
    context.font = "600 28px 'Segoe UI', sans-serif";
    context.fillText(
      game.status === "won" ? "You win!" : "Game over",
      WIDTH / 2,
      225,
    );
    context.font = "14px 'Segoe UI', sans-serif";
    context.fillText("Choose New game to play again", WIDTH / 2, 254);
  }
}
