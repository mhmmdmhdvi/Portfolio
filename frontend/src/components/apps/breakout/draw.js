import { WIDTH, HEIGHT } from "./game";

const colors = ["#8eafff", "#6396f1", "#4fbbd5", "#57c3ae", "#e8bc76"];
export function drawBreakout(context, game) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const background = context.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, "#14253b");
  background.addColorStop(1, "#101a2b");
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    context.fillStyle = colors[brick.row ?? 0];
    context.beginPath();
    context.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
    context.fill();
    context.fillStyle = "#ffffff2b";
    context.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
  }
  const paddle = game.paddle;
  context.fillStyle = "#f1f5f9";
  context.beginPath();
  context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
  context.fill();
  context.fillStyle = "#679ef4";
  context.beginPath();
  context.roundRect(paddle.x + 8, paddle.y + 3, paddle.width - 16, 3, 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
  context.fill();
  if (["won", "lost"].includes(game.status)) {
    context.fillStyle = "#101a2bdd";
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
