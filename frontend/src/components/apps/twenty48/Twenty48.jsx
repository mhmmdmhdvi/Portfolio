import { useEffect, useRef, useState } from "react";
import { GameShell } from "../shared/GameShell";
import { continueGame, createGame, moveGame, undoGame } from "./game";
import "./twenty48.css";

const keys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
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

export function Twenty48({ active = true }) {
  const [game, setGame] = useState(() => createGame(seed()));
  const swipe = useRef(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if (
        document.hidden ||
        typing(event.target) ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      setGame((current) => moveGame(current, direction));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  function move(direction) {
    if (active && !document.hidden)
      setGame((current) => moveGame(current, direction));
  }

  function finishSwipe(event) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    move(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  }

  return (
    <GameShell
      title="2048"
      status={
        game.status === "won"
          ? "You reached 2048!"
          : game.status === "lost"
            ? "No moves left"
            : "Join the numbers"
      }
      toolbar={
        <>
          <button
            className="game-button primary"
            onClick={() => setGame(createGame(seed()))}
          >
            New game
          </button>
          <button
            className="game-button"
            disabled={!game.previous}
            onClick={() => setGame(undoGame)}
          >
            Undo
          </button>
          <span className="arcade-score">
            Score {game.score.toLocaleString()}
          </span>
        </>
      }
      footer="Arrow keys, swipe, or the buttons below to slide. Equal tiles join once per move. Reach 2048, then keep going. Undo restores your last move."
    >
      <div className="twenty48-stage">
        <div className="twenty48-heading">
          <strong>2048</strong>
          <span>
            Merge matching tiles
            <br />
            to reach 2048.
          </span>
        </div>
        <div
          className="twenty48-board"
          role="group"
          aria-label="2048 board"
          onPointerDown={(event) => {
            if (event.button !== 0 || !active || game.status !== "playing")
              return;
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
          {game.board.map((value, index) => (
            <div
              key={index}
              className={`twenty48-tile tile-${value > 2048 ? "super" : value}`}
              aria-label={`Row ${Math.floor(index / 4) + 1}, column ${(index % 4) + 1}: ${value || "empty"}`}
            >
              <span key={value}>{value || ""}</span>
            </div>
          ))}
          {game.status !== "playing" && (
            <div className="twenty48-overlay">
              <strong>
                {game.status === "won" ? "You reached 2048!" : "No moves left"}
              </strong>
              <p>
                {game.status === "won"
                  ? "Select Continue to keep playing."
                  : `Score: ${game.score.toLocaleString()}. Start a new game or undo your last move.`}
              </p>
              <div className="twenty48-overlay-actions">
                {game.status === "won" && (
                  <button
                    className="game-button primary"
                    onClick={() => setGame(continueGame)}
                  >
                    Continue
                  </button>
                )}
                {game.status === "lost" && game.previous && (
                  <button
                    className="game-button"
                    onClick={() => setGame(undoGame)}
                  >
                    Undo last move
                  </button>
                )}
                <button
                  className={`game-button ${game.status === "lost" ? "primary" : ""}`}
                  onClick={() => setGame(createGame(seed()))}
                >
                  New game
                </button>
              </div>
            </div>
          )}
        </div>
        <div
          className="game-direction-controls twenty48-controls"
          aria-label="2048 direction controls"
        >
          {arrows.map(([direction, arrow]) => (
            <button
              key={direction}
              className="game-button"
              aria-label={`Slide ${direction}`}
              disabled={!active || game.status !== "playing"}
              onClick={() => move(direction)}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
