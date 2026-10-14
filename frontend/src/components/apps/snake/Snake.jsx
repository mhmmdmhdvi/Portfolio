import { useEffect, useId, useRef, useState } from "react";
import { GameShell } from "../shared/GameShell";
import {
  createSnake,
  pauseSnake,
  startSnake,
  stepSnake,
  turnSnake,
} from "./game";
import "./snake.css";

const keys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
const arrows = [
  ["up", "↑"],
  ["left", "←"],
  ["down", "↓"],
  ["right", "→"],
];
const seed = () => (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
const typing = (target) =>
  target?.isContentEditable ||
  Boolean(
    target?.closest?.(
      "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
    ),
  );

export function Snake({ active = true }) {
  const [game, setGame] = useState(() => createSnake({ seed: seed() }));
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const swipe = useRef(null);
  const board = useRef(null);
  const patternId = useId();

  useEffect(() => {
    const onVisibility = () => {
      setVisible(!document.hidden);
      if (document.hidden) {
        swipe.current = null;
        setGame(pauseSnake);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!active) {
      swipe.current = null;
      setGame(pauseSnake);
    }
  }, [active]);

  useEffect(() => {
    if (!active || !visible || game.status !== "playing") return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setGame(stepSnake);
    }, 120);
    return () => window.clearInterval(timer);
  }, [active, visible, game.status]);

  useEffect(() => {
    if (!active || !visible) return;
    const onKey = (event) => {
      if (
        typing(event.target) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const direction = keys[event.key] || keys[event.key.toLowerCase()];
      if (direction) {
        event.preventDefault();
        setGame((current) => turnSnake(current, direction));
      } else if (
        event.code === "Space" &&
        !event.repeat &&
        event.target?.tagName !== "BUTTON"
      ) {
        event.preventDefault();
        setGame((current) =>
          current.status === "playing"
            ? pauseSnake(current)
            : startSnake(current),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, visible]);

  function turn(direction) {
    if (active && visible) {
      setGame((current) => turnSnake(current, direction));
      board.current?.focus({ preventScroll: true });
    }
  }

  function togglePlaying() {
    setGame((current) =>
      current.status === "playing" ? pauseSnake(current) : startSnake(current),
    );
    board.current?.focus({ preventScroll: true });
  }

  function newGame() {
    swipe.current = null;
    setGame(createSnake({ seed: seed() }));
    board.current?.focus({ preventScroll: true });
  }

  function finishSwipe(event) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    turn(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  }

  const messages = {
    ready: "Ready",
    playing: "Playing",
    paused: "Paused · Resume to continue",
    lost: "Game over",
    won: "Board complete!",
  };
  const overlay = game.status !== "playing";

  return (
    <GameShell
      title="Snake"
      status={messages[game.status]}
      toolbar={
        <>
          <button
            className="game-button primary"
            disabled={
              !active || !visible || ["lost", "won"].includes(game.status)
            }
            onClick={togglePlaying}
          >
            {game.status === "playing"
              ? "Pause"
              : game.status === "paused"
                ? "Resume"
                : "Start"}
          </button>
          <button
            className="game-button"
            onClick={newGame}
          >
            New game
          </button>
          <span className="arcade-score">Score {game.score}</span>
        </>
      }
      footer="Arrow keys / WASD or swipe to turn · Space to start or pause"
    >
      <div className="snake-stage">
        <div
          ref={board}
          className="snake-board"
          role="group"
          aria-label="Snake play area"
          tabIndex={0}
          onPointerDown={(event) => {
            if (
              event.button !== 0 ||
              !active ||
              !visible ||
              game.status !== "playing"
            )
              return;
            board.current?.focus({ preventScroll: true });
            swipe.current = {
              x: event.clientX,
              y: event.clientY,
              id: event.pointerId,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={finishSwipe}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          <svg
            viewBox="0 0 400 400"
            role="img"
            aria-label={`Snake board, length ${game.snake.length}, score ${game.score}`}
          >
            <defs>
              <pattern
                id={patternId}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M20 0H0V20"
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity=".055"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="400" height="400" rx="8" fill="#101e28" />
            <rect width="400" height="400" fill={`url(#${patternId})`} />
            {game.food && (
              <g>
                <circle
                  cx={game.food.x * 20 + 10}
                  cy={game.food.y * 20 + 10}
                  r="7"
                  fill="#ff806e"
                />
                <path
                  d={`M${game.food.x * 20 + 10} ${game.food.y * 20 + 3}l3 -2`}
                  stroke="#acdd9b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}
            {game.snake.map((cell, index) => (
              <rect
                key={`${cell.x},${cell.y}`}
                x={cell.x * 20 + 1}
                y={cell.y * 20 + 1}
                width="18"
                height="18"
                rx={index === 0 ? "5" : "3"}
                fill={index === 0 ? "#b6f6ba" : "#60c790"}
              />
            ))}
            {game.snake[0] && (
              <circle
                cx={game.snake[0].x * 20 + 10}
                cy={game.snake[0].y * 20 + 10}
                r="2"
                fill="#153a2a"
              />
            )}
          </svg>
          {overlay && (
            <div className="snake-overlay">
              <strong>
                {game.status === "ready"
                  ? "Ready"
                  : game.status === "paused"
                    ? "Paused"
                    : game.status === "won"
                      ? "You win!"
                      : "Game over"}
              </strong>
              <p>
                {game.status === "ready"
                  ? "Collect food. Avoid the walls and your tail."
                  : game.status === "paused"
                    ? "Select Resume to continue."
                    : `Score: ${game.score}`}
              </p>
              {["ready", "paused"].includes(game.status) ? (
                <button
                  className="game-button primary"
                  disabled={!active || !visible}
                  onClick={togglePlaying}
                >
                  {game.status === "ready" ? "Start game" : "Resume game"}
                </button>
              ) : (
                <button
                  className="game-button primary"
                  onClick={newGame}
                >
                  New game
                </button>
              )}
            </div>
          )}
        </div>
        <div
          className="game-direction-controls snake-controls"
          aria-label="Snake direction controls"
        >
          {arrows.map(([direction, arrow]) => (
            <button
              key={direction}
              className="game-button"
              aria-label={`Turn ${direction}`}
              disabled={!active || !visible || game.status !== "playing"}
              onClick={() => turn(direction)}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
