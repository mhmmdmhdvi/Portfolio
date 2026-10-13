import { describe, expect, it } from "vitest";
import {
  canMove,
  createGame,
  drawCard,
  isWon,
  moveCards,
  undo,
} from "./engine";

const card = (rank, suit = "spades", faceUp = true) => ({
  id: `${suit}-${rank}`,
  rank,
  suit,
  faceUp,
});
const game = (overrides = {}) => ({
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: [[], [], [], [], [], [], []],
  moves: 0,
  won: false,
  history: [],
  ...overrides,
});
const tableau = (pileIndex, cardIndex) => ({
  pile: "tableau",
  pileIndex,
  cardIndex,
});
const foundation = (pileIndex) => ({ pile: "foundation", pileIndex });
const completeSuit = (suit, count = 13) =>
  Array.from({ length: count }, (_, index) => card(index + 1, suit));

describe("new Klondike deals", () => {
  it("deals all 52 unique cards across seven increasing columns and the stock", () => {
    const state = createGame(() => 0.5);
    expect(state.tableau.map((column) => column.length)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(state.stock).toHaveLength(24);
    const cards = [...state.stock, ...state.tableau.flat()];
    expect(new Set(cards.map((entry) => entry.id)).size).toBe(52);
    for (const suit of ["spades", "hearts", "clubs", "diamonds"])
      expect(
        cards
          .filter((entry) => entry.suit === suit)
          .map((entry) => entry.rank)
          .sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(state.waste).toEqual([]);
    expect(state.foundations).toEqual([[], [], [], []]);
    expect(state.moves).toBe(0);
    expect(state.history).toEqual([]);
  });

  it("exposes only the last card of each column and keeps stock cards hidden", () => {
    const state = createGame(() => 0.25);
    for (const column of state.tableau)
      expect(column.map((entry) => entry.faceUp)).toEqual(
        column.map((_, index) => index === column.length - 1),
      );
    expect(state.stock.every((entry) => !entry.faceUp)).toBe(true);
  });

  it("uses the supplied random source to produce different deals", () => {
    const first = createGame(() => 0);
    const second = createGame(() => 0.75);
    expect(first.tableau.flat().map((entry) => entry.id)).not.toEqual(
      second.tableau.flat().map((entry) => entry.id),
    );
  });
});

describe("draw-one stock", () => {
  it("draws just the top stock card face up without mutating the prior position", () => {
    const state = game({
      stock: [card(1, "spades", false), card(2, "hearts", false)],
    });
    const next = drawCard(state);
    expect(next.stock.map((entry) => entry.id)).toEqual(["spades-1"]);
    expect(next.waste).toEqual([card(2, "hearts")]);
    expect(next.moves).toBe(1);
    expect(next.history).toHaveLength(1);
    expect(state.stock).toHaveLength(2);
    expect(state.stock[1].faceUp).toBe(false);
  });

  it("recycles the waste face down and preserves the next draw order", () => {
    const state = game({ waste: [card(3), card(2), card(1)] });
    const recycled = drawCard(state);
    expect(recycled.stock).toEqual([
      card(1, "spades", false),
      card(2, "spades", false),
      card(3, "spades", false),
    ]);
    expect(recycled.waste).toEqual([]);
    expect(drawCard(recycled).waste).toEqual([card(3)]);
    expect(recycled.moves).toBe(1);
  });

  it("does not count empty stock and waste clicks as moves", () => {
    const state = game();
    expect(drawCard(state)).toBe(state);
  });
});

describe("legal tableau runs", () => {
  it("moves a descending alternating-color run together onto the next rank", () => {
    const state = game({
      tableau: [
        [card(9, "hearts"), card(8), card(7, "diamonds")],
        [card(10, "clubs")],
        [],
        [],
        [],
        [],
        [],
      ],
    });
    expect(canMove(state, tableau(0, 0), tableau(1))).toBe(true);
    const next = moveCards(state, tableau(0, 0), tableau(1));
    expect(next.tableau[0]).toEqual([]);
    expect(next.tableau[1].map((entry) => entry.id)).toEqual([
      "clubs-10",
      "hearts-9",
      "spades-8",
      "diamonds-7",
    ]);
    expect(next.moves).toBe(1);
    expect(state.tableau[0]).toHaveLength(3);
  });

  it("moves a suffix without removing the cards above it", () => {
    const state = game({
      tableau: [
        [card(10), card(9, "hearts"), card(8, "clubs")],
        [card(10, "clubs")],
        [],
        [],
        [],
        [],
        [],
      ],
    });
    const next = moveCards(state, tableau(0, 1), tableau(1));
    expect(next.tableau[0]).toEqual([card(10)]);
    expect(next.tableau[1].map((entry) => entry.rank)).toEqual([10, 9, 8]);
  });

  it("automatically turns up a newly exposed tableau card", () => {
    const state = game({
      tableau: [[card(4, "clubs", false), card(1)], [], [], [], [], [], []],
    });
    const next = moveCards(state, tableau(0, 1), foundation(0));
    expect(next.tableau[0]).toEqual([card(4, "clubs")]);
    expect(state.tableau[0][0].faceUp).toBe(false);
  });

  it.each([
    [card(9), card(10, "clubs")],
    [card(8, "hearts"), card(10)],
    [card(9, "hearts"), card(10, "clubs", false)],
  ])(
    "rejects wrong color, wrong rank, or hidden destinations",
    (source, destination) => {
      const state = game({
        waste: [source],
        tableau: [[destination], [], [], [], [], [], []],
      });
      expect(canMove(state, { pile: "waste" }, tableau(0))).toBe(false);
      expect(moveCards(state, { pile: "waste" }, tableau(0))).toBe(state);
    },
  );

  it("allows only a king at the start of a run in an empty column", () => {
    const state = game({
      tableau: [
        [card(13, "hearts"), card(12)],
        [card(12, "diamonds")],
        [],
        [],
        [],
        [],
        [],
      ],
    });
    expect(canMove(state, tableau(0, 0), tableau(2))).toBe(true);
    expect(canMove(state, tableau(1, 0), tableau(2))).toBe(false);
  });

  it.each([
    [card(9, "hearts", false), card(8)],
    [card(9, "hearts"), card(8, "diamonds")],
    [card(9, "hearts"), card(7)],
  ])("rejects hidden or internally invalid runs", (first, second) => {
    const state = game({
      tableau: [[first, second], [card(10)], [], [], [], [], []],
    });
    expect(canMove(state, tableau(0, 0), tableau(1))).toBe(false);
  });

  it("allows the top waste and foundation card to return to the tableau", () => {
    const state = game({
      waste: [card(5), card(4, "hearts")],
      foundations: [[card(1), card(2)], [], [], []],
      tableau: [[card(5, "clubs")], [card(3, "diamonds")], [], [], [], [], []],
    });
    const fromWaste = moveCards(state, { pile: "waste" }, tableau(0));
    expect(fromWaste.waste).toEqual([card(5)]);
    expect(fromWaste.tableau[0]).toEqual([card(5, "clubs"), card(4, "hearts")]);
    const fromFoundation = moveCards(state, foundation(0), tableau(1));
    expect(fromFoundation.foundations[0]).toEqual([card(1)]);
    expect(fromFoundation.tableau[1]).toEqual([card(3, "diamonds"), card(2)]);
  });
});

describe("suit foundations", () => {
  it("starts with an ace and builds upward in the assigned suit", () => {
    const start = game({ waste: [card(1, "hearts")] });
    const next = moveCards(start, { pile: "waste" }, foundation(1));
    expect(next.foundations[1]).toEqual([card(1, "hearts")]);
    const withTwo = { ...next, waste: [card(2, "hearts")] };
    expect(
      moveCards(withTwo, { pile: "waste" }, foundation(1)).foundations[1],
    ).toEqual([card(1, "hearts"), card(2, "hearts")]);
  });

  it.each([
    [card(2), []],
    [card(1, "hearts"), []],
    [card(3), [card(1)]],
    [card(2, "clubs"), [card(1)]],
  ])("rejects missing aces, wrong suits, and skipped ranks", (source, pile) => {
    const state = game({ waste: [source], foundations: [pile, [], [], []] });
    expect(canMove(state, { pile: "waste" }, foundation(0))).toBe(false);
  });

  it("accepts only a single exposed tableau card into a foundation", () => {
    const state = game({
      tableau: [[card(2, "hearts"), card(1)], [], [], [], [], [], []],
      foundations: [[], [card(1, "hearts")], [], []],
    });
    expect(canMove(state, tableau(0, 0), foundation(1))).toBe(false);
    expect(canMove(state, tableau(0, 1), foundation(0))).toBe(true);
  });

  it("rejects self-moves, foundation transfers, and invalid source indices", () => {
    const state = game({
      tableau: [[card(13)], [], [], [], [], [], []],
      foundations: [[card(1)], [], [], []],
    });
    for (const [source, destination] of [
      [tableau(0, 0), tableau(0)],
      [foundation(0), foundation(1)],
      [tableau(0, -1), tableau(1)],
      [tableau(8, 0), tableau(1)],
      [{ pile: "stock" }, tableau(1)],
      [{ pile: "waste" }, tableau(1)],
    ])
      expect(canMove(state, source, destination)).toBe(false);
  });
});

describe("undo and victory", () => {
  it("undoes draws, recycled stock, moves, and automatic flips", () => {
    const original = game({
      stock: [card(3, "clubs", false)],
      waste: [card(1)],
      tableau: [
        [card(4, "clubs", false), card(1, "hearts")],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
    });
    const moved = moveCards(original, tableau(0, 1), foundation(1));
    expect(undo(moved)).toEqual(original);
    const drawn = drawCard(original);
    expect(undo(drawn)).toEqual(original);
    const recycled = drawCard(game({ waste: [card(2)] }));
    expect(undo(recycled)).toEqual(game({ waste: [card(2)] }));
    expect(undo(original)).toBe(original);
  });

  it("retains only the most recent 100 undo positions", () => {
    let state = game({ stock: [card(1, "spades", false)] });
    for (let index = 0; index < 105; index++) state = drawCard(state);
    expect(state.history).toHaveLength(100);
    for (let index = 0; index < 100; index++) state = undo(state);
    expect(state.moves).toBe(5);
    expect(state.history).toEqual([]);
    expect(undo(state)).toBe(state);
  });

  it("wins after placing the last king and allows undoing that winning move", () => {
    const state = game({
      waste: [card(13, "diamonds")],
      foundations: [
        completeSuit("spades"),
        completeSuit("hearts"),
        completeSuit("clubs"),
        completeSuit("diamonds", 12),
      ],
    });
    expect(isWon(state)).toBe(false);
    const won = moveCards(state, { pile: "waste" }, foundation(3));
    expect(won.won).toBe(true);
    expect(isWon(won)).toBe(true);
    expect(undo(won)).toEqual(state);
    expect(drawCard(won)).toBe(won);
    expect(moveCards(won, foundation(3), tableau(0))).toBe(won);
  });

  it("does not treat piles of repeated cards as a completed game", () => {
    const state = game({
      foundations: Array.from({ length: 4 }, () =>
        Array.from({ length: 13 }, () => card(1)),
      ),
    });
    expect(isWon(state)).toBe(false);
  });
});
