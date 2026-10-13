import { useEffect, useRef, useState } from "react";
import { GameShell } from "../shared/GameShell";
import { ChessBoard } from "./ChessBoard";
import { shouldComputerPlay, startComputerTurn } from "./computer";
import {
  attemptMove,
  createGame,
  getSnapshot,
  legalTargets,
  PIECE_SYMBOLS,
  undoTurn,
} from "./game";
import "./chess.css";

function Player({ color, turn, mode, captured, thinking }) {
  const name =
    color === "w"
      ? mode === "computer"
        ? "You · White"
        : "White"
      : mode === "computer"
        ? "Computer · Black"
        : "Black";
  const enemy = color === "w" ? "b" : "w";
  return (
    <div className={`chess-player${turn === color ? " current" : ""}`}>
      <span className={`chess-player-avatar ${color}`} aria-hidden="true">
        {PIECE_SYMBOLS[color].k}
      </span>
      <div className="chess-player-name">
        <strong>{name}</strong>
        <span
          className="chess-captured"
          aria-label={`${captured.length} captured pieces`}
        >
          {captured.length
            ? captured.map((type, index) => (
                <span key={index} aria-hidden="true">
                  {PIECE_SYMBOLS[enemy][type]}
                </span>
              ))
            : "No captures yet"}
        </span>
      </div>
      {thinking && (
        <span className="chess-thinking" aria-label="Computer thinking" />
      )}
      {turn === color && (
        <span className="chess-turn-dot" aria-label="Current turn" />
      )}
    </div>
  );
}

function MoveHistory({ history }) {
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [history.length]);
  const pairs = [];
  for (let index = 0; index < history.length; index += 2)
    pairs.push(history.slice(index, index + 2));
  return (
    <section className="chess-history" aria-label="Move history">
      <h3>
        Moves <span>{history.length}</span>
      </h3>
      <div className="chess-history-columns" aria-hidden="true">
        <span>#</span>
        <span>White</span>
        <span>Black</span>
      </div>
      <ol ref={listRef} className="chess-moves">
        {pairs.map((pair, index) => (
          <li key={index}>
            <span className="chess-move-number">{index + 1}.</span>
            <span>{pair[0]?.san ?? "—"}</span>
            <span>{pair[1]?.san ?? "—"}</span>
          </li>
        ))}
      </ol>
      {!history.length && (
        <p className="chess-history-empty">Your moves will appear here.</p>
      )}
    </section>
  );
}

export function Chess({ active = true }) {
  const gameRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  if (!gameRef.current) gameRef.current = createGame();
  const [snapshot, setSnapshot] = useState(() => getSnapshot(gameRef.current));
  const [mode, setMode] = useState("computer");
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [engineError, setEngineError] = useState("");
  const [retry, setRetry] = useState(0);
  const cancelRef = useRef(null);

  function cancelComputer() {
    cancelRef.current?.();
    cancelRef.current = null;
    setThinking(false);
  }

  function refreshGame() {
    setSnapshot(getSnapshot(gameRef.current));
    setSelected(null);
    setPromotion(null);
  }

  useEffect(() => {
    if (
      !shouldComputerPlay({
        active,
        mode,
        turn: snapshot.turn,
        over: snapshot.over,
        promotion,
      })
    ) {
      setThinking(false);
      return;
    }
    setThinking(true);
    setEngineError("");
    const cancel = startComputerTurn({
      game: gameRef.current,
      isEligible: () => activeRef.current,
      onMove: (move) => {
        setThinking(false);
        const result = attemptMove(gameRef.current, move);
        if (result.ok) refreshGame();
        else
          setEngineError(
            "The computer could not finish this move. Please retry.",
          );
      },
      onError: (message) => {
        setThinking(false);
        setEngineError(message);
      },
    });
    cancelRef.current = cancel;
    return () => {
      cancel();
      if (cancelRef.current === cancel) cancelRef.current = null;
    };
  }, [
    active,
    mode,
    snapshot.fen,
    snapshot.turn,
    snapshot.over,
    promotion,
    retry,
  ]);

  function newGame(nextMode = mode) {
    cancelComputer();
    gameRef.current.reset();
    setMode(nextMode);
    setEngineError("");
    refreshGame();
  }

  function undo() {
    cancelComputer();
    undoTurn(gameRef.current, mode);
    setEngineError("");
    refreshGame();
  }

  const enabled =
    active &&
    !snapshot.over &&
    !promotion &&
    (mode === "local" || snapshot.turn === "w");
  const targets = selected ? legalTargets(gameRef.current, selected) : [];

  function selectSquare(square) {
    if (!enabled) return;
    if (!square || square === selected) {
      setSelected(null);
      return;
    }
    if (selected) {
      const result = attemptMove(gameRef.current, {
        from: selected,
        to: square,
      });
      if (result.ok) {
        refreshGame();
        return;
      }
      if (result.reason === "promotion") {
        setPromotion({ from: selected, to: square });
        return;
      }
    }
    setSelected(
      snapshot.squares[square]?.color === snapshot.turn ? square : null,
    );
  }

  function promote(type) {
    if (!active || !promotion) return;
    if (attemptMove(gameRef.current, { ...promotion, promotion: type }).ok)
      refreshGame();
  }

  const topColor = flipped ? "w" : "b";
  const bottomColor = flipped ? "b" : "w";
  const status = thinking
    ? "Black to move · computer is thinking…"
    : snapshot.status.text;
  return (
    <GameShell
      title="Chess"
      status={status}
      toolbar={
        <>
          <button
            type="button"
            className="game-button primary"
            onClick={() => newGame()}
          >
            New game
          </button>
          <button
            type="button"
            className="game-button"
            onClick={undo}
            disabled={!snapshot.history.length}
          >
            Undo
          </button>
          <select
            aria-label="Game mode"
            value={mode}
            onChange={(event) => newGame(event.target.value)}
          >
            <option value="computer">Play computer</option>
            <option value="local">Two players</option>
          </select>
          <button
            type="button"
            className="game-button"
            aria-pressed={flipped}
            onClick={() => setFlipped((value) => !value)}
          >
            Flip board
          </button>
        </>
      }
      footer="Select a piece, then a highlighted square. Arrow keys move board focus; Enter selects. Changing mode starts a new game."
    >
      <div className="chess-layout">
        <div className="chess-play-area">
          <Player
            color={topColor}
            turn={snapshot.over ? null : snapshot.turn}
            mode={mode}
            captured={snapshot.captured[topColor]}
            thinking={topColor === "b" && thinking}
          />
          <ChessBoard
            snapshot={snapshot}
            selected={selected}
            targets={targets}
            flipped={flipped}
            enabled={enabled}
            active={active}
            promotion={promotion}
            onSquare={selectSquare}
            onPromote={promote}
            onCancelPromotion={() => setPromotion(null)}
          />
          <Player
            color={bottomColor}
            turn={snapshot.over ? null : snapshot.turn}
            mode={mode}
            captured={snapshot.captured[bottomColor]}
            thinking={bottomColor === "b" && thinking}
          />
        </div>
        <aside className="chess-sidebar">
          <div
            className={`chess-position-status${snapshot.over ? " ended" : ""}`}
          >
            <span className="chess-status-eyebrow">
              {snapshot.over
                ? "Game finished"
                : mode === "computer"
                  ? "You play White"
                  : "Local game"}
            </span>
            <strong>{snapshot.status.text}</strong>
            {!active && !snapshot.over && <span>Game paused</span>}
            {promotion && <span>Choose a promotion piece.</span>}
            {engineError && <p role="alert">{engineError}</p>}
            {engineError && (
              <button
                type="button"
                className="game-button"
                disabled={!active}
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry move
              </button>
            )}
            {snapshot.over && (
              <button
                type="button"
                className="game-button primary"
                onClick={() => newGame()}
              >
                Play again
              </button>
            )}
          </div>
          <MoveHistory history={snapshot.history} />
        </aside>
      </div>
    </GameShell>
  );
}
