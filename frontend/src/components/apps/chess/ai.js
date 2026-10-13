import { coordinateMove, restoreGame } from "./game";

const VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
const MATE = 100000;
const BUDGET_EXHAUSTED = Symbol("search budget exhausted");

function movePriority(move) {
  const capture = move.captured
    ? 10 * VALUES[move.captured] - VALUES[move.piece]
    : 0;
  const promotion = move.promotion ? VALUES[move.promotion] : 0;
  return (
    capture +
    promotion +
    (move.san.includes("#") ? MATE : move.san.includes("+") ? 50 : 0)
  );
}

function orderedMoves(game) {
  return game
    .moves({ verbose: true })
    .sort((a, b) => movePriority(b) - movePriority(a));
}

function materialAndPosition(game) {
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const file = piece.square.charCodeAt(0) - 97;
      const rank = Number(piece.square[1]) - 1;
      const center = 7 - Math.abs(file - 3.5) - Math.abs(rank - 3.5);
      let bonus = center * (piece.type === "n" || piece.type === "b" ? 8 : 2);
      if (piece.type === "p")
        bonus += (piece.color === "w" ? rank : 7 - rank) * 7;
      if (piece.type === "k") bonus = -center * 3;
      score += (piece.color === "w" ? 1 : -1) * (VALUES[piece.type] + bonus);
    }
  }
  return game.turn() === "w" ? score : -score;
}

function search(game, depth, alpha, beta, ply, budget) {
  budget.nodes += 1;
  if (budget.nodes > budget.maxNodes || budget.now() >= budget.deadline)
    throw BUDGET_EXHAUSTED;
  const moves = orderedMoves(game);
  if (!moves.length) return game.isCheck() ? -MATE + ply : 0;
  if (
    game.isThreefoldRepetition() ||
    game.isDrawByFiftyMoves() ||
    game.isInsufficientMaterial()
  )
    return 0;
  if (depth === 0) return materialAndPosition(game);

  let best = -Infinity;
  for (const move of moves) {
    game.move(coordinateMove(move));
    let score;
    try {
      score = -search(game, depth - 1, -beta, -alpha, ply + 1, budget);
    } finally {
      game.undo();
    }
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

// Iterative deepening always retains a legal move even if a depth is interrupted.
// The worker lifecycle cancels jobs; these limits also bound every individual search.
export function chooseComputerMove(position, options = {}) {
  const game = restoreGame(position);
  if (game.isGameOver()) return null;
  const now = options.now ?? (() => performance.now());
  const budget = {
    nodes: 0,
    maxNodes: Math.max(1, Math.min(options.maxNodes ?? 4500, 12000)),
    now,
    deadline: now() + Math.max(1, Math.min(options.timeMs ?? 400, 1000)),
  };
  const maxDepth = Math.max(1, Math.min(options.maxDepth ?? 3, 4));
  const moves = orderedMoves(game);
  let bestMove = moves[0];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    let iterationBest = bestMove;
    let bestScore = -Infinity;
    const candidates = [bestMove, ...moves.filter((move) => move !== bestMove)];
    try {
      for (const move of candidates) {
        game.move(coordinateMove(move));
        let score;
        try {
          score = -search(game, depth - 1, -Infinity, -bestScore, 1, budget);
        } finally {
          game.undo();
        }
        if (score > bestScore) {
          bestScore = score;
          iterationBest = move;
        }
        if (score >= MATE - 1) return coordinateMove(move);
      }
      bestMove = iterationBest;
    } catch (error) {
      if (error !== BUDGET_EXHAUSTED) throw error;
      break;
    }
  }
  return coordinateMove(bestMove);
}
