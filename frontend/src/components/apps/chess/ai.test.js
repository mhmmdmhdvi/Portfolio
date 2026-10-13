import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { chooseComputerMove } from "./ai";

describe("bounded chess computer", () => {
  it("returns a legal move for a normal position", () => {
    const game = new Chess();
    game.move("e4");
    const move = chooseComputerMove(game.fen(), {
      maxDepth: 2,
      maxNodes: 400,
      timeMs: 1000,
    });
    expect(move).not.toBeNull();
    expect(() => game.move(move)).not.toThrow();
    expect(game.turn()).toBe("w");
  });

  it("finds the available mate in one", () => {
    const game = new Chess();
    ["f3", "e5", "g4"].forEach((move) => game.move(move));
    expect(
      chooseComputerMove(game.fen(), { maxDepth: 2, timeMs: 1000 }),
    ).toEqual({ from: "d8", to: "h4" });
  });

  it("returns a legal promotion move", () => {
    const game = new Chess("7k/P7/8/8/8/8/8/4K3 w - - 0 1");
    const move = chooseComputerMove(game.fen(), { maxDepth: 1 });
    expect(move).toEqual({ from: "a7", to: "a8", promotion: "q" });
    expect(() => game.move(move)).not.toThrow();
  });

  it.each(["7k/5K2/6Q1/8/8/8/8/8 b - - 0 1", "7k/8/8/8/8/8/8/4K3 w - - 0 1"])(
    "returns no move after the game ends: %s",
    (fen) => {
      expect(chooseComputerMove(fen)).toBeNull();
    },
  );

  it("keeps a legal fallback when the search budget expires immediately", () => {
    const game = new Chess();
    let ticks = 0;
    const move = chooseComputerMove(game.fen(), {
      maxDepth: 4,
      maxNodes: 1,
      timeMs: 1,
      now: () => ticks++ * 100,
    });
    expect(move).not.toBeNull();
    expect(() => game.move(move)).not.toThrow();
  });

  it("honors repetition when given the full game rather than only a FEN", () => {
    expect(
      chooseComputerMove({
        initialFen: new Chess().fen(),
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
      }),
    ).toBeNull();
  });
});
