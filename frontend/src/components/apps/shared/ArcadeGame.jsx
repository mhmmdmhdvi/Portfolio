import { useEffect, useRef, useState } from "react";
import { GameShell } from "./GameShell";
import { useAnimationLoop } from "./useAnimationLoop";

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
    input.current = emptyInput();
    setPaused(false);
    render();
  }
  function launchBall() {
    publish(launch(game.current));
    setPaused(false);
    render();
  }
  actions.current = {
    launchBall,
    pause: () => setPaused((previous) => !previous),
  };

  useEffect(render, [draw]);
  useAnimationLoop(
    (seconds) => {
      publish(advance(game.current, input.current, seconds));
      render();
    },
    active && !paused && ["ready", "playing"].includes(hud.status),
  );

  useEffect(() => {
    if (!active) {
      input.current = emptyInput();
      return;
    }
    function keydown(event) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target.closest?.(
          "input, textarea, select, [contenteditable='true']",
        )
      )
        return;
      const key = event.key.toLowerCase();
      if (
        key === "arrowleft" ||
        key === "a" ||
        key === "arrowright" ||
        key === "d"
      ) {
        event.preventDefault();
        input.current.pointerX = null;
        input.current[key === "arrowleft" || key === "a" ? "left" : "right"] =
          true;
      } else if (
        key === " " &&
        !event.repeat &&
        !event.target.closest?.("button")
      ) {
        event.preventDefault();
        actions.current.launchBall();
      } else if (key === "p" && !event.repeat) {
        event.preventDefault();
        actions.current.pause();
      }
    }
    function keyup(event) {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") input.current.left = false;
      if (key === "arrowright" || key === "d") input.current.right = false;
    }
    function clearInput() {
      input.current = emptyInput();
    }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clearInput);
    document.addEventListener("visibilitychange", clearInput);
    return () => {
      clearInput();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("visibilitychange", clearInput);
    };
  }, [active]);

  function aim(event) {
    if (!paddle) return;
    const bounds = canvas.current.getBoundingClientRect();
    const scale = Math.min(bounds.width / width, bounds.height / height);
    input.current.pointerX =
      (event.clientX - bounds.left - (bounds.width - width * scale) / 2) /
      scale;
  }
  function hold(side) {
    return {
      onPointerDown: (event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        input.current.pointerX = null;
        input.current[side] = true;
      },
      onPointerUp: () => {
        input.current[side] = false;
      },
      onPointerCancel: () => {
        input.current[side] = false;
      },
      onLostPointerCapture: () => {
        input.current[side] = false;
      },
    };
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
            onClick={launchBall}
            disabled={hud.status !== "ready"}
          >
            Launch ball
          </button>
          <button
            className="game-button"
            onClick={() => setPaused((value) => !value)}
            disabled={hud.status !== "playing"}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <span className="arcade-score">
            Score: {hud.score} · {paddle ? "Lives" : "Balls"}: {hud.lives}
          </span>
        </>
      }
      footer={
        paddle
          ? "Move: mouse, touch, or ← → / A D · Launch: Space · Pause: P"
          : "Flippers: ← → / A D, or hold the buttons · Launch: Space · Pause: P"
      }
    >
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
          {...hold("left")}
        >
          ◀ {paddle ? "Left" : "Left flipper"}
        </button>
        <button
          className="game-button"
          aria-label={paddle ? "Move right" : "Right flipper"}
          {...hold("right")}
        >
          {paddle ? "Right" : "Right flipper"} ▶
        </button>
      </div>
    </GameShell>
  );
}
