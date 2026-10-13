import { expect, it } from "vitest";
import { createBoard, revealCells } from "./game";

it("keeps the first selected cell and its neighbors free of mines", () => {
  const board = createBoard(40);
  expect(board.filter((cell) => cell.mine)).toHaveLength(10);
  for (const index of [30, 31, 32, 39, 40, 41, 48, 49, 50])
    expect(board[index].mine).toBe(false);
});
it("reveals connected empty cells without revealing flagged cells", () => {
  const board = Array.from({ length: 81 }, (_, i) => ({
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: i === 40,
  }));
  const result = revealCells(board, 0);
  expect(result.filter((cell) => cell.revealed)).toHaveLength(80);
  expect(result[40].flagged).toBe(true);
  expect(result[40].revealed).toBe(false);
});
