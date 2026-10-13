import { useEffect, useRef, useState } from "react";
import {
  boardRows,
  PIECE_NAMES,
  PIECE_SYMBOLS,
  PROMOTION_CHOICES,
} from "./game";

function squareLabel(square, piece, selected, target) {
  const name = piece
    ? `${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type]}`
    : "empty";
  return `${square}, ${name}${selected ? ", selected" : ""}${target ? ", legal move" : ""}`;
}

export function ChessBoard({
  snapshot,
  selected,
  targets,
  flipped,
  enabled,
  active,
  promotion,
  onSquare,
  onPromote,
  onCancelPromotion,
}) {
  const rows = boardRows(flipped);
  const boardRef = useRef(null);
  const promotionRef = useRef(null);
  const [focusSquare, setFocusSquare] = useState("e2");
  const targetMap = new Map(targets.map((target) => [target.square, target]));

  useEffect(() => {
    if (promotion && active) promotionRef.current?.focus();
  }, [promotion, active]);

  function handleKey(event) {
    if (!active || !event.target.dataset.square) return;
    const square = event.target.dataset.square;
    const row = rows.findIndex((rank) => rank.includes(square));
    const col = rows[row].indexOf(square);
    const next = {
      ArrowUp: rows[Math.max(0, row - 1)][col],
      ArrowDown: rows[Math.min(7, row + 1)][col],
      ArrowLeft: rows[row][Math.max(0, col - 1)],
      ArrowRight: rows[row][Math.min(7, col + 1)],
      Home: rows[row][0],
      End: rows[row][7],
    }[event.key];
    if (next) {
      event.preventDefault();
      event.stopPropagation();
      setFocusSquare(next);
      boardRef.current.querySelector(`[data-square="${next}"]`)?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onSquare(null);
    }
  }

  return (
    <div className="chess-board-wrap">
      <div
        ref={boardRef}
        className="chess-board"
        role="grid"
        aria-label="Chessboard"
        aria-disabled={!enabled}
        onKeyDown={handleKey}
      >
        {rows.map((row, rowIndex) => (
          <div className="chess-rank" role="row" key={rowIndex}>
            {row.map((square, colIndex) => {
              const piece = snapshot.squares[square];
              const target = targetMap.get(square);
              const dark =
                (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 1;
              const last =
                snapshot.lastMove?.from === square ||
                snapshot.lastMove?.to === square;
              const className = [
                "chess-square",
                dark ? "dark" : "light",
                last ? "last-move" : "",
                selected === square ? "selected" : "",
                snapshot.checkSquare === square ? "in-check" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={square}
                  type="button"
                  role="gridcell"
                  className={className}
                  data-square={square}
                  aria-label={squareLabel(
                    square,
                    piece,
                    selected === square,
                    target,
                  )}
                  aria-selected={selected === square}
                  tabIndex={focusSquare === square ? 0 : -1}
                  onFocus={() => setFocusSquare(square)}
                  onClick={() => onSquare(square)}
                >
                  {colIndex === 0 && (
                    <span className="chess-coordinate rank" aria-hidden="true">
                      {square[1]}
                    </span>
                  )}
                  {rowIndex === 7 && (
                    <span className="chess-coordinate file" aria-hidden="true">
                      {square[0]}
                    </span>
                  )}
                  {piece && (
                    <span
                      className={`chess-piece ${piece.color === "w" ? "white" : "black"}`}
                      aria-hidden="true"
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  )}
                  {target && (
                    <span
                      className={`chess-move-hint${target.capture ? " capture" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {promotion && (
        <div className="chess-promotion-backdrop">
          <div
            className="chess-promotion"
            role="dialog"
            aria-label="Choose promotion"
            onKeyDown={(event) => {
              if (active && event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onCancelPromotion();
              }
            }}
          >
            <strong>Promote your pawn</strong>
            <span>Choose a piece for {promotion.to}.</span>
            <div className="chess-promotion-choices">
              {PROMOTION_CHOICES.map((type, index) => (
                <button
                  key={type}
                  ref={index === 0 ? promotionRef : null}
                  type="button"
                  aria-label={`Promote to ${PIECE_NAMES[type]}`}
                  disabled={!active}
                  onClick={() => onPromote(type)}
                >
                  <span
                    className={`chess-piece ${snapshot.turn === "w" ? "white" : "black"}`}
                    aria-hidden="true"
                  >
                    {PIECE_SYMBOLS[snapshot.turn][type]}
                  </span>
                  <span>{PIECE_NAMES[type]}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="game-button"
              onClick={onCancelPromotion}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
