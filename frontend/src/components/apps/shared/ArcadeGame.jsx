import { useEffect, useRef, useState } from "react";
import { GameShell } from "./GameShell";
import { useAnimationLoop } from "./useAnimationLoop";
import { useArcadeControls } from "./useArcadeControls";

const summary = ({ status, score, lives }) => ({ status, score, lives });
const emptyInput = () => ({ left: false, right: false, pointerX: null });

export function ArcadeGame({
  active,
  title,
  width,
  height,
  create,
  advance,
  launch,
  draw,
  paddle = false,
}) {
  const canvas = useRef(null);
  const game = useRef(null);
  if (!game.current) game.current = create();
  const input = useRef(emptyInput());
  const actions = useRef(null);
  const [hud, setHud] = useState(() => summary(game.current));
  const [paused, setPaused] = useState(false);
  const controls = useArcadeControls({ active, input, canvas, actions });

  function publish(next) {
    game.current = next;
    const update = summary(next);
    setHud((previous) =>
      previous.score === update.score &&
      previous.status === update.status &&
      previous.lives === update.lives
        ? previous
        : update,
    );
  }
  function render() {
    if (canvas.current) draw(canvas.current.getContext("2d"), game.current);
  }
  function newGame() {
    publish(create());
    controls.clear();
    setPaused(false);
    render();
  }
  function launchBall() {
    if (game.current.status !== "ready") return;
    publish(launch(game.current));
    setPaused(false);
    render();
  }
  actions.current = {
    launchBall,
    pause: () => {
      if (game.current.status === "playing") {
        controls.clear();
        setPaused((previous) => !previous);
      }
    },
  };

  useEffect(render, [draw]);
  useAnimationLoop(
    (seconds) => {
      publish(advance(game.current, input.current, seconds));
      render();
    },
    active && !paused && ["ready", "playing"].includes(hud.status),
  );

  function aim(event) {
    if (!paddle) return;
    const bounds = canvas.current.getBoundingClientRect();
    const scale = Math.min(bounds.width / width, bounds.height / height);
    input.current.pointerX =
      (event.clientX - bounds.left - (bounds.width - width * scale) / 2) /
      scale;
  }
  const status =
    hud.status === "won"
      ? "You win!"
      : hud.status === "lost"
        ? "Game over"
        : paused || !active
          ? "Paused"
          : hud.status === "ready"
            ? "Ready to launch"
            : "Playing";
  return (
    <GameShell
      title={title}
      status={status}
      toolbar={
        <>
          <button className="game-button" onClick={newGame}>
            New game
          </button>
          <button
            className="game-button primary"
            onClick={hud.status === "ready" ? launchBall : hud.status === "playing" ? actions.current.pause : newGame}
          >
            {hud.status === "ready" ? "Launch ball" : hud.status === "playing" ? paused ? "Resume" : "Pause" : "Play again"}
          </button>
        </>
      }
      footer={
        paddle
          ? "Move: mouse, touch, or ← → / A D · Launch: Space · Pause: P"
          : "Flippers: ← → / A D, or hold the buttons · Launch: Space · Pause: P"
      }
    >
      <div className="arcade-hud">
        <span><small>Score</small><strong>{hud.score.toLocaleString()}</strong></span>
        <span><small>{paddle ? "Lives" : "Balls"}</small><strong>{hud.lives}</strong></span>
      </div>
      <div className="arcade-stage">
        <canvas
          ref={canvas}
          width={width}
          height={height}
          role="img"
          aria-label={`${title} board`}
          tabIndex={0}
          onPointerMove={aim}
          onPointerDown={(event) => {
            event.currentTarget.focus();
            aim(event);
          }}
        />
      </div>
      <div className="game-direction-controls">
        <button
          className="game-button"
          aria-label={paddle ? "Move left" : "Left flipper"}
          {...controls.buttonProps("left")}
        >
          ◀ {paddle ? "Left" : "Left flipper"}
        </button>
        <button
          className="game-button"
          aria-label={paddle ? "Move right" : "Right flipper"}
          {...controls.buttonProps("right")}
        >
          {paddle ? "Right" : "Right flipper"} ▶
        </button>
      </div>
    </GameShell>
  );
}
