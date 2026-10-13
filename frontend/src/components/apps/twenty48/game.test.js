import { describe, expect, it } from "vitest";
import { canMove, continueGame, createGame, mergeLine, moveBoard, moveGame, spawnTile, undoGame } from "./game.js";

const game = (board, overrides = {}) => ({ board, score: 0, seed: 12345, status: "playing", continued: false, previous: null, ...overrides });
const empty = () => Array(16).fill(0);

describe("2048 merges", () => {
  it.each([
    [[2, 2, 2, 2], [4, 4, 0, 0], 8],
    [[2, 2, 4, 0], [4, 4, 0, 0], 4],
    [[0, 4, 0, 4], [8, 0, 0, 0], 8],
    [[4, 4, 8, 8], [8, 16, 0, 0], 24],
    [[2, 4, 8, 16], [2, 4, 8, 16], 0],
  ])("merges %j once per tile", (line, expected, score) => {
    expect(mergeLine(line)).toEqual({ line: expected, score });
  });

  it.each([
    ["left", [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["right", [0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ])("moves a row %s", (direction, expected) => {
    const board = [2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(moveBoard(board, direction)).toEqual({ board: expected, score: 4, changed: true });
    expect(board.slice(0, 4)).toEqual([2, 0, 2, 0]);
  });

  it.each([
    ["up", [8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["down", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0]],
  ])("moves a column %s", (direction, expected) => {
    const board = [4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0];
    expect(moveBoard(board, direction)).toEqual({ board: expected, score: 8, changed: true });
  });
});

describe("2048 state", () => {
  it("starts with exactly two tiles and zero score", () => {
    const state = createGame(42);
    expect(state).toEqual(expect.objectContaining({ score: 0, status: "playing", previous: null }));
    expect(state.board.filter(Boolean)).toHaveLength(2);
    expect(state.board.every((value) => [0, 2, 4].includes(value))).toBe(true);
  });

  it("never spawns on an occupied tile and leaves full boards unchanged", () => {
    const board = Array(16).fill(8);
    board[6] = 0;
    const next = spawnTile(board, 42);
    expect([2, 4]).toContain(next.board[6]);
    expect(next.board.filter((value) => value === 8)).toHaveLength(15);
    expect(board[6]).toBe(0);
    const full = Array(16).fill(8);
    expect(spawnTile(full, 42)).toEqual({ board: full, seed: 42 });
  });

  it("spawns one tile after a changed move and includes merge points in the score", () => {
    const board = empty();
    board[0] = 2;
    board[1] = 2;
    const next = moveGame(game(board), "left");
    expect(next.score).toBe(4);
    expect(next.board[0]).toBe(4);
    expect(next.board.filter(Boolean)).toHaveLength(2);
  });

  it("does not spawn or consume randomness when a move does not change the board", () => {
    const board = empty();
    board[0] = 2;
    const state = game(board);
    expect(moveGame(state, "left")).toBe(state);
  });

  it("restores board, score, and randomness on one-step undo", () => {
    const board = empty();
    board[0] = 2;
    board[1] = 2;
    const state = game(board, { score: 16 });
    const next = moveGame(state, "left");
    expect(next.board).not.toEqual(state.board);
    expect(next.previous).toEqual(state);
    const restored = undoGame(next);
    expect(restored).toEqual(state);
    expect(undoGame(restored)).toBe(restored);
    expect(moveGame(restored, "left").board).toEqual(next.board);
  });

  it("announces 2048 once and allows continued play", () => {
    const board = empty();
    board[0] = 1024;
    board[1] = 1024;
    const won = moveGame(game(board), "left");
    expect(won.status).toBe("won");
    expect(won.score).toBe(2048);
    expect(moveGame(won, "right")).toBe(won);
    const continued = continueGame(won);
    expect(continued.status).toBe("playing");
    expect(continued.continued).toBe(true);
    expect(moveGame(continued, "right").status).toBe("playing");
  });

  it("detects a locked board but permits either horizontal or vertical merges", () => {
    const locked = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
    expect(canMove(locked)).toBe(false);
    expect(canMove([2, 2, ...locked.slice(2)])).toBe(true);
    expect(canMove([2, 4, 2, 4, 2, ...locked.slice(5)])).toBe(true);
    expect(canMove([0, ...locked.slice(1)])).toBe(true);
  });

  it("sets lost after the final empty cell is filled without available merges", () => {
    const board = [0, 8, 16, 8, 16, 8, 16, 8, 8, 16, 8, 16, 16, 8, 16, 8];
    expect(moveGame(game(board), "left").status).toBe("lost");
  });
});
