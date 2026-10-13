const randomStep = (seed) => (Math.imul(1664525, seed) + 1013904223) >>> 0;

export function mergeLine(line) {
  const tiles = line.filter(Boolean);
  const merged = [];
  let score = 0;
  for (let index = 0; index < tiles.length; index++) {
    if (tiles[index] === tiles[index + 1]) {
      const value = tiles[index] * 2;
      merged.push(value);
      score += value;
      index++;
    } else merged.push(tiles[index]);
  }
  while (merged.length < 4) merged.push(0);
  return { line: merged, score };
}

export function moveBoard(board, direction) {
  if (!["left", "right", "up", "down"].includes(direction)) return { board, score: 0, changed: false };
  const next = [...board];
  let score = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, position) => {
      const offset = ["right", "down"].includes(direction) ? 3 - position : position;
      return ["left", "right"].includes(direction) ? line * 4 + offset : offset * 4 + line;
    });
    const result = mergeLine(indices.map((index) => board[index]));
    indices.forEach((index, position) => { next[index] = result.line[position]; });
    score += result.score;
  }
  return { board: next, score, changed: next.some((value, index) => value !== board[index]) };
}

export function spawnTile(board, seed) {
  const free = [];
  board.forEach((value, index) => { if (!value) free.push(index); });
  if (!free.length) return { board, seed };
  const positionSeed = randomStep(seed);
  const valueSeed = randomStep(positionSeed);
  const next = [...board];
  next[free[Math.floor((positionSeed / 4294967296) * free.length)]] = valueSeed / 4294967296 < 0.9 ? 2 : 4;
  return { board: next, seed: valueSeed };
}

export function createGame(seed = 1) {
  const first = spawnTile(Array(16).fill(0), seed >>> 0);
  const second = spawnTile(first.board, first.seed);
  return { ...second, score: 0, status: "playing", continued: false, previous: null };
}

export function canMove(board) {
  if (board.includes(0)) return true;
  return board.some((value, index) => (
    (index % 4 < 3 && value === board[index + 1])
    || (index < 12 && value === board[index + 4])
  ));
}

export function moveGame(state, direction) {
  if (state.status !== "playing") return state;
  const moved = moveBoard(state.board, direction);
  if (!moved.changed) return state;
  const spawned = spawnTile(moved.board, state.seed);
  const won = !state.continued && spawned.board.some((value) => value >= 2048);
  return {
    ...state,
    ...spawned,
    score: state.score + moved.score,
    status: won ? "won" : canMove(spawned.board) ? "playing" : "lost",
    previous: { ...state, previous: null },
  };
}

export function undoGame(state) {
  return state.previous ? { ...state.previous, previous: null } : state;
}

export function continueGame(state) {
  return state.status === "won"
    ? { ...state, continued: true, status: canMove(state.board) ? "playing" : "lost" }
    : state;
}
