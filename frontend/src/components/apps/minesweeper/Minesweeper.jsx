import { useEffect, useState } from "react";
import { Glyph } from "../../ui/Glyph";
import { createBoard, revealCells } from "./game";

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
  useEffect(() => {
    if (status !== "playing" || !active) return;
    const timer = setInterval(() => {
      if (!document.hidden) setSeconds((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status, active]);
  function reveal(index) {
    if (status === "lost" || status === "won" || board[index].revealed) return;
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
    if (!board[index].revealed && !["won", "lost"].includes(status))
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
  }
  return (
    <div className="minesweeper">
      <header>
        <span>⚑ {10 - board.filter((cell) => cell.flagged).length}</span>
        <button className="icon-button" aria-label="New game" onClick={reset}>
          <Glyph name="refresh" size={22} />
        </button>
        <span>{String(seconds).padStart(3, "0")}</span>
      </header>
      <div className="mine-board" role="group" aria-label="Minefield">
        {board.map((cell, index) => (
          <button
            key={index}
            aria-label={`Cell ${Math.floor(index / 9) + 1}, ${(index % 9) + 1}${cell.flagged ? ", flagged" : ""}${cell.revealed ? ", revealed" : ""}`}
            className={`${cell.revealed ? "revealed" : ""} ${cell.mine && cell.revealed ? "mine" : ""} adjacent-${cell.adjacent}`}
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
      <footer>
        <button
          className={`small-button ${flagMode ? "enabled" : ""}`}
          aria-pressed={flagMode}
          onClick={() => setFlagMode((value) => !value)}
        >
          ⚑ Flag mode
        </button>
        <span>
          {status === "won"
            ? "You win!"
            : status === "lost"
              ? "Game over"
              : "9 × 9 · 10 mines"}
        </span>
      </footer>
    </div>
  );
}
