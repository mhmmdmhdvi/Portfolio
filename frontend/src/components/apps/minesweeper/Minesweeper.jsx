import { useEffect, useState } from "react";
import { GameShell } from "../shared/GameShell";
import { createBoard, revealCells } from "./game";
import "./minesweeper.css";

const emptyBoard = () =>
  Array.from({ length: 81 }, () => ({
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
  }));

export function Minesweeper({ active = true }) {
  const [board, setBoard] = useState(emptyBoard);
  const [status, setStatus] = useState("ready");
  const [seconds, setSeconds] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const finished = status === "lost" || status === "won";
  const locked = !active || finished;
  const flags = board.filter((cell) => cell.flagged).length;
  const safe = board.filter((cell) => cell.revealed && !cell.mine).length;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  useEffect(() => {
    if (status !== "playing" || !active) return;
    const timer = setInterval(() => {
      if (!document.hidden) setSeconds((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status, active]);
  function reveal(index) {
    if (locked || board[index].revealed) return;
    if (flagMode) {
      flag(index);
      return;
    }
    if (board[index].flagged) return;
    const current =
      status === "ready"
        ? createBoard(index).map((cell, i) => ({
            ...cell,
            flagged: board[i].flagged,
          }))
        : board;
    const next = revealCells(current, index);
    if (next[index].mine) {
      setStatus("lost");
      next.forEach((cell) => {
        if (cell.mine) cell.revealed = true;
      });
    } else if (next.filter((cell) => !cell.mine && cell.revealed).length === 71)
      setStatus("won");
    else setStatus("playing");
    setBoard(next);
  }
  function flag(index) {
    if (!locked && !board[index].revealed)
      setBoard((previous) =>
        previous.map((cell, i) =>
          i === index ? { ...cell, flagged: !cell.flagged } : cell,
        ),
      );
  }
  function reset() {
    setBoard(emptyBoard());
    setStatus("ready");
    setSeconds(0);
    setFlagMode(false);
  }
  return (
    <div className="mw-app">
      <GameShell
        title="Minesweeper"
        status={status === "won" ? "You win!" : status === "lost" ? "Game over" : !active ? "Paused" : status === "playing" ? "Playing" : "Ready"}
        toolbar={(
          <>
            <button type="button" className="game-button primary" onClick={reset} disabled={!active}>New game</button>
            <button type="button" className={`game-button ${flagMode ? "mw-flag-mode" : ""}`} aria-pressed={flagMode} onClick={() => setFlagMode((value) => !value)} disabled={locked}>
              <span aria-hidden="true">⚑</span> Flag mode
            </button>
          </>
        )}
        footer="Click to reveal. Right-click or use Flag mode to place or remove a flag."
      >
        <div className="mw-stage">
          <div className="mw-stats">
            <div className="mw-stat"><span className="mw-stat-value">{flags}<small>/10</small></span><span>Flags</span></div>
            <div className="mw-stat"><span className="mw-stat-value">{safe}<small>/71</small></span><span>Safe squares</span></div>
            <div className="mw-stat"><span className="mw-stat-value" role="timer" aria-label="Elapsed time">{clock}</span><span>Time</span></div>
          </div>
      <div className="mw-board" role="group" aria-label="Minefield">
        {board.map((cell, index) => (
          <button
            type="button"
            key={index}
            aria-label={`Cell ${Math.floor(index / 9) + 1}, ${(index % 9) + 1}${cell.flagged ? ", flagged" : ""}${cell.revealed ? ", revealed" : ""}`}
            aria-description={cell.revealed ? cell.mine ? "Mine" : cell.adjacent ? `${cell.adjacent} adjacent ${cell.adjacent === 1 ? "mine" : "mines"}` : "Empty, no adjacent mines" : cell.flagged ? "Flagged. Remove the flag before revealing" : "Unrevealed"}
            className={`mw-cell ${cell.revealed ? "mw-revealed" : ""} ${cell.mine && cell.revealed ? "mw-mine" : ""} ${cell.flagged && !cell.revealed ? "mw-flagged" : ""} mw-adjacent-${cell.adjacent}`}
            disabled={locked || cell.revealed}
            onClick={() => reveal(index)}
            onContextMenu={(event) => {
              event.preventDefault();
              flag(index);
            }}
          >
            {cell.flagged && !cell.revealed
              ? "⚑"
              : cell.revealed
                ? cell.mine
                  ? "✹"
                  : cell.adjacent || ""
                : ""}
          </button>
        ))}
      </div>
        </div>
      </GameShell>
    </div>
  );
}
