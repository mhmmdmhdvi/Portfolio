import { Chess, DEFAULT_POSITION, SQUARES } from "chess.js";

export const PIECE_NAMES = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
export const PIECE_SYMBOLS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
export const PROMOTION_CHOICES = ["q", "r", "b", "n"];

export function createGame(fen) {
  return new Chess(fen);
}

export function coordinateMove(move) {
  return {
    from: move.from,
    to: move.to,
    ...(move.promotion ? { promotion: move.promotion } : {}),
  };
}

export function attemptMove(game, move) {
  if (game.isGameOver()) return { ok: false, reason: "over" };
  if (!move || !SQUARES.includes(move.from) || !SQUARES.includes(move.to)) {
    return { ok: false, reason: "illegal" };
  }
  const candidates = game
    .moves({ square: move.from, verbose: true })
    .filter((candidate) => candidate.to === move.to);
  if (!move.promotion && candidates.some((candidate) => candidate.promotion)) {
    return { ok: false, reason: "promotion", choices: PROMOTION_CHOICES };
  }
  const candidate = candidates.find(
    (item) => item.promotion === move.promotion,
  );
  if (!candidate) return { ok: false, reason: "illegal" };
  return { ok: true, move: game.move(coordinateMove(candidate)) };
}

export function gameStatus(game) {
  const turn = game.turn() === "w" ? "White" : "Black";
  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "b" : "w";
    return {
      kind: "checkmate",
      winner,
      text: `${winner === "w" ? "White" : "Black"} wins by checkmate`,
    };
  }
  if (game.isStalemate())
    return { kind: "stalemate", text: "Draw · stalemate" };
  if (game.isThreefoldRepetition())
    return { kind: "repetition", text: "Draw · threefold repetition" };
  if (game.isDrawByFiftyMoves())
    return { kind: "fifty-moves", text: "Draw · fifty-move rule" };
  if (game.isInsufficientMaterial())
    return { kind: "material", text: "Draw · insufficient material" };
  return {
    kind: "playing",
    text: `${turn} to move${game.isCheck() ? " · check" : ""}`,
  };
}

export function getSnapshot(game) {
  const status = gameStatus(game);
  const history = game.history({ verbose: true }).map((move) => ({
    ...coordinateMove(move),
    san: move.san,
    color: move.color,
    ...(move.captured ? { captured: move.captured } : {}),
  }));
  const squares = Object.fromEntries(
    SQUARES.map((square) => [square, game.get(square) ?? null]),
  );
  const captured = { w: [], b: [] };
  for (const move of history) {
    if (move.captured) captured[move.color].push(move.captured);
  }
  return {
    fen: game.fen(),
    turn: game.turn(),
    squares,
    history,
    captured,
    status,
    over: status.kind !== "playing",
    checkSquare: game.isCheck()
      ? game.findPiece({ color: game.turn(), type: "k" })[0]
      : null,
    lastMove: history.at(-1) ?? null,
  };
}

export function legalTargets(game, square) {
  if (!square || game.isGameOver()) return [];
  const targets = new Map();
  for (const move of game.moves({ square, verbose: true })) {
    targets.set(move.to, {
      square: move.to,
      capture: Boolean(move.captured),
      promotion: Boolean(move.promotion),
    });
  }
  return [...targets.values()];
}

export function undoTurn(game, mode = "local") {
  let undone = game.undo() ? 1 : 0;
  if (mode === "computer" && undone && game.turn() !== "w" && game.undo())
    undone += 1;
  return undone;
}

export function serializeGame(game) {
  const history = game.history({ verbose: true });
  return {
    initialFen: history[0]?.before ?? game.fen(),
    moves: history.map(coordinateMove),
  };
}

export function restoreGame(position) {
  if (typeof position === "string") return createGame(position);
  const game = createGame(position?.initialFen ?? DEFAULT_POSITION);
  for (const move of position?.moves ?? []) game.move(move);
  return game;
}

export function boardRows(flipped = false) {
  const files = flipped ? "hgfedcba" : "abcdefgh";
  const ranks = flipped ? "12345678" : "87654321";
  return [...ranks].map((rank) => [...files].map((file) => `${file}${rank}`));
}
