import { describe, expect, it } from "vitest";
import { createSnake, pauseSnake, placeFood, startSnake, stepSnake, turnSnake } from "./game.js";

const moving = (overrides = {}) => ({
  size: 20,
  snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
  direction: "right",
  nextDirection: null,
  food: { x: 0, y: 0 },
  score: 0,
  seed: 123,
  status: "playing",
  ...overrides,
});

describe("Snake", () => {
  it("starts ready with a connected snake and food outside its body", () => {
    const state = createSnake({ seed: 42 });
    expect(state).toEqual(expect.objectContaining({ status: "ready", score: 0, size: 20 }));
    expect(state.snake).toHaveLength(3);
    expect(state.snake).not.toContainEqual(state.food);
  });

  it("advances one cell without changing length or mutating its previous board", () => {
    const state = moving();
    const next = stepSnake(state);
    expect(next.snake).toEqual([{ x: 11, y: 10 }, { x: 10, y: 10 }, { x: 9, y: 10 }]);
    expect(state.snake[0]).toEqual({ x: 10, y: 10 });
    expect(next.score).toBe(0);
  });

  it("grows and adds a point when the next cell contains food", () => {
    const next = stepSnake(moving({ food: { x: 11, y: 10 } }));
    expect(next.snake).toHaveLength(4);
    expect(next.score).toBe(1);
    expect(next.snake).not.toContainEqual(next.food);
  });

  it("rejects a reverse turn", () => {
    const state = moving();
    expect(turnSnake(state, "left")).toBe(state);
  });

  it("accepts only one turn between ticks so rapid inputs cannot reverse into the body", () => {
    const up = turnSnake(moving(), "up");
    expect(up.nextDirection).toBe("up");
    expect(turnSnake(up, "left")).toBe(up);
    const next = stepSnake(up);
    expect(next.snake[0]).toEqual({ x: 10, y: 9 });
    expect(next.direction).toBe("up");
    expect(next.nextDirection).toBeNull();
    expect(turnSnake(next, "left").nextDirection).toBe("left");
  });

  it("loses when the head reaches a wall", () => {
    expect(stepSnake(moving({ snake: [{ x: 19, y: 1 }, { x: 18, y: 1 }] })).status).toBe("lost");
  });

  it("loses when the head reaches an occupied body cell", () => {
    const state = moving({
      snake: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }],
      direction: "up",
    });
    expect(stepSnake(state).status).toBe("lost");
  });

  it("allows a move into the tail cell that is vacated on the same tick", () => {
    const next = stepSnake(moving({
      snake: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }],
      direction: "down",
    }));
    expect(next.status).toBe("playing");
    expect(next.snake[0]).toEqual({ x: 1, y: 2 });
  });

  it("places food in the only free cell and handles a full board", () => {
    const body = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
    expect(placeFood(body, 2, 44).food).toEqual({ x: 1, y: 1 });
    expect(placeFood([...body, { x: 1, y: 1 }], 2, 44).food).toBeNull();
  });

  it("wins on eating the final free cell", () => {
    const next = stepSnake(moving({
      size: 2,
      snake: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }],
      direction: "down",
      food: { x: 1, y: 1 },
    }));
    expect(next.status).toBe("won");
    expect(next.snake).toHaveLength(4);
    expect(next.food).toBeNull();
  });

  it("does not advance while ready or paused and clears pending turns on pause", () => {
    const state = moving({ status: "ready" });
    expect(stepSnake(state)).toBe(state);
    expect(startSnake(state).status).toBe("playing");
    const paused = pauseSnake(moving({ nextDirection: "up" }));
    expect(paused.status).toBe("paused");
    expect(paused.nextDirection).toBeNull();
    expect(stepSnake(paused)).toBe(paused);
    expect(startSnake(paused).status).toBe("playing");
    expect(startSnake(moving({ status: "lost" })).status).toBe("lost");
  });
});
