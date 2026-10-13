export function neighbors(index) {
  const result = [];
  const row = Math.floor(index / 9);
  const col = index % 9;
  for (let y = -1; y <= 1; y++)
    for (let x = -1; x <= 1; x++) {
      if (
        (x || y) &&
        row + y >= 0 &&
        row + y < 9 &&
        col + x >= 0 &&
        col + x < 9
      )
        result.push((row + y) * 9 + col + x);
    }
  return result;
}

export function createBoard(first) {
  const board = Array.from({ length: 81 }, () => ({
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
  }));
  const protectedCells = new Set([first, ...neighbors(first)]);
  const available = board
    .map((_, i) => i)
    .filter((i) => !protectedCells.has(i));
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  available.slice(0, 10).forEach((i) => {
    board[i].mine = true;
  });
  board.forEach((cell, i) => {
    cell.adjacent = neighbors(i).filter((n) => board[n].mine).length;
  });
  return board;
}

export function revealCells(board, index) {
  const next = board.map((cell) => ({ ...cell }));
  const queue = [index];
  while (queue.length) {
    const current = queue.pop();
    const cell = next[current];
    if (!cell || cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (!cell.mine && cell.adjacent === 0) queue.push(...neighbors(current));
  }
  return next;
}
