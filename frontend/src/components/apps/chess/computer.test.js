import { describe, expect, it } from "vitest";
import { createGame } from "./game";
import { shouldComputerPlay, startComputerTurn } from "./computer";

function workerFixture() {
  return {
    onmessage: null,
    onerror: null,
    postMessage(message) {
      this.request = message;
    },
    terminate() {
      this.terminated = true;
    },
  };
}

describe("computer turn lifecycle", () => {
  const eligible = { active: true, mode: "computer", turn: "b", over: false };

  it.each([
    { active: false },
    { mode: "local" },
    { turn: "w" },
    { over: true },
    { promotion: true },
  ])("does not start computer play when ineligible: %j", (change) => {
    expect(shouldComputerPlay({ ...eligible, ...change })).toBe(false);
  });

  it("allows a paused computer turn to resume when active again", () => {
    expect(shouldComputerPlay({ ...eligible, active: false })).toBe(false);
    expect(shouldComputerPlay(eligible)).toBe(true);
  });

  it("applies the current computer reply", () => {
    const game = createGame();
    game.move("e4");
    const worker = workerFixture();
    startComputerTurn({
      game,
      createWorker: () => worker,
      onMove: (move) => game.move(move),
    });
    expect(worker.request).toMatchObject({
      position: { moves: [{ from: "e2", to: "e4" }] },
    });
    worker.onmessage({
      data: { ...worker.request, move: { from: "e7", to: "e5" } },
    });
    expect(game.history()).toEqual(["e4", "e5"]);
  });

  it("rejects a reply already queued when its job was cancelled", () => {
    const game = createGame();
    game.move("e4");
    const worker = workerFixture();
    const cancel = startComputerTurn({
      game,
      createWorker: () => worker,
      onMove: (move) => game.move(move),
    });
    const queuedMessage = worker.onmessage;
    expect(typeof queuedMessage).toBe("function");
    cancel();
    queuedMessage({
      data: { ...worker.request, move: { from: "e7", to: "e5" } },
    });
    expect(game.history()).toEqual(["e4"]);
  });

  it("rejects replies for a position that was undone", () => {
    const game = createGame();
    game.move("e4");
    const worker = workerFixture();
    startComputerTurn({
      game,
      createWorker: () => worker,
      onMove: (move) => game.move(move),
    });
    const queuedMessage = worker.onmessage;
    expect(typeof queuedMessage).toBe("function");
    game.undo();
    queuedMessage({
      data: { ...worker.request, move: { from: "e7", to: "e5" } },
    });
    expect(game.history()).toEqual([]);
  });

  it("rejects a queued reply when the app has become inactive before cleanup", () => {
    const game = createGame();
    game.move("e4");
    const worker = workerFixture();
    let active = true;
    startComputerTurn({
      game,
      createWorker: () => worker,
      onMove: (move) => game.move(move),
      isEligible: () => active,
    });
    expect(typeof worker.onmessage).toBe("function");
    active = false;
    worker.onmessage({
      data: { ...worker.request, move: { from: "e7", to: "e5" } },
    });
    expect(game.history()).toEqual(["e4"]);
  });

  it("reports an engine failure without changing the position", () => {
    const game = createGame();
    game.move("e4");
    const worker = workerFixture();
    let error;
    startComputerTurn({
      game,
      createWorker: () => worker,
      onMove: (move) => game.move(move),
      onError: (message) => {
        error = message;
      },
    });
    expect(typeof worker.onmessage).toBe("function");
    worker.onmessage({
      data: {
        ...worker.request,
        error: "The computer could not finish this move.",
      },
    });
    expect(error).toBeTruthy();
    expect(game.history()).toEqual(["e4"]);
  });
});
