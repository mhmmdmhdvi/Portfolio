import { describe, expect, it } from "vitest";
import {
  attemptMove,
  createGame,
  getSnapshot,
  legalTargets,
  serializeGame,
  undoTurn,
} from "./game";

describe("chess game adapter", () => {
  it("applies a legal move and exposes the changed turn and history", () => {
    const game = createGame();
    expect(attemptMove(game, { from: "e2", to: "e4" })).toMatchObject({
      ok: true,
    });
    expect(getSnapshot(game)).toMatchObject({
      turn: "b",
      history: [{ san: "e4", from: "e2", to: "e4" }],
      squares: { e4: { color: "w", type: "p" }, e2: null },
    });
  });

  it("rejects illegal moves without altering the position", () => {
    const game = createGame();
    const before = game.fen();
    expect(attemptMove(game, { from: "e2", to: "e5" })).toEqual({
      ok: false,
      reason: "illegal",
    });
    expect(game.fen()).toBe(before);
    expect(attemptMove(game, { from: "e7", to: "e5" })).toEqual({
      ok: false,
      reason: "illegal",
    });
    expect(game.fen()).toBe(before);
  });

  it("moves the rook with the king during castling", () => {
    const game = createGame("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(attemptMove(game, { from: "e1", to: "g1" })).toMatchObject({
      ok: true,
    });
    expect(getSnapshot(game)).toMatchObject({
      squares: {
        g1: { type: "k", color: "w" },
        f1: { type: "r", color: "w" },
        h1: null,
        e1: null,
      },
    });
    expect(undoTurn(game, "local")).toBe(1);
    expect(game.get("h1")).toEqual({ type: "r", color: "w" });
  });

  it("marks en passant as a capture and removes the passed pawn", () => {
    const game = createGame();
    ["e4", "a6", "e5", "d5"].forEach((move) => game.move(move));
    expect(legalTargets(game, "e5")).toContainEqual({
      square: "d6",
      capture: true,
      promotion: false,
    });
    expect(attemptMove(game, { from: "e5", to: "d6" })).toMatchObject({
      ok: true,
    });
    expect(getSnapshot(game)).toMatchObject({
      squares: { d5: null, d6: { color: "w", type: "p" } },
      captured: { w: ["p"], b: [] },
    });
  });

  it("requires an explicit promotion choice and supports underpromotion", () => {
    const game = createGame("7k/P7/8/8/8/8/8/4K3 w - - 0 1");
    const before = game.fen();
    expect(attemptMove(game, { from: "a7", to: "a8" })).toEqual({
      ok: false,
      reason: "promotion",
      choices: ["q", "r", "b", "n"],
    });
    expect(game.fen()).toBe(before);
    expect(attemptMove(game, { from: "a7", to: "a8", promotion: "k" })).toEqual(
      { ok: false, reason: "illegal" },
    );
    expect(
      attemptMove(game, { from: "a7", to: "a8", promotion: "n" }),
    ).toMatchObject({ ok: true });
    expect(game.get("a8")).toEqual({ color: "w", type: "n" });
  });

  it("prevents a pinned piece from exposing its king", () => {
    const game = createGame("4r2k/8/8/8/8/8/4R3/4K3 w - - 0 1");
    expect(legalTargets(game, "e2").map((move) => move.square)).not.toContain(
      "d2",
    );
    expect(attemptMove(game, { from: "e2", to: "d2" })).toEqual({
      ok: false,
      reason: "illegal",
    });
  });

  it("reports checkmate and prevents further play", () => {
    const game = createGame();
    ["f3", "e5", "g4", "Qh4#"].forEach((move) => game.move(move));
    expect(getSnapshot(game)).toMatchObject({
      over: true,
      checkSquare: "e1",
      status: { kind: "checkmate", winner: "b" },
    });
    expect(legalTargets(game, "e1")).toEqual([]);
    expect(attemptMove(game, { from: "e1", to: "f2" })).toEqual({
      ok: false,
      reason: "over",
    });
  });

  it.each([
    ["7k/5K2/6Q1/8/8/8/8/8 b - - 0 1", "stalemate"],
    ["7k/8/8/8/8/8/8/4K3 w - - 0 1", "material"],
    ["7k/8/8/8/8/8/8/R3K3 w - - 100 51", "fifty-moves"],
  ])("reports the correct draw reason for %s", (fen, kind) => {
    expect(getSnapshot(createGame(fen))).toMatchObject({
      over: true,
      status: { kind },
    });
  });

  it("retains the history needed for threefold repetition", () => {
    const game = createGame();
    ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].forEach((move) =>
      game.move(move),
    );
    expect(getSnapshot(game)).toMatchObject({
      over: true,
      status: { kind: "repetition" },
    });
    expect(serializeGame(game)).toMatchObject({
      moves: [
        { from: "g1", to: "f3" },
        { from: "g8", to: "f6" },
        { from: "f3", to: "g1" },
        { from: "f6", to: "g8" },
        { from: "g1", to: "f3" },
        { from: "g8", to: "f6" },
        { from: "f3", to: "g1" },
        { from: "f6", to: "g8" },
      ],
    });
  });

  it("undoes a completed computer turn back to the human's turn", () => {
    const game = createGame();
    ["e4", "e5", "Nf3", "Nc6"].forEach((move) => game.move(move));
    expect(undoTurn(game, "computer")).toBe(2);
    expect(game.history()).toEqual(["e4", "e5"]);
    expect(game.turn()).toBe("w");
  });

  it("undoes only the pending human move before a computer reply", () => {
    const game = createGame();
    game.move("e4");
    expect(undoTurn(game, "computer")).toBe(1);
    expect(game.history()).toEqual([]);
    expect(game.turn()).toBe("w");
    expect(undoTurn(game, "computer")).toBe(0);
  });
});
