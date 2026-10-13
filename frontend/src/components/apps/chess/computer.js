import { serializeGame } from "./game";

let nextJobId = 0;

export function shouldComputerPlay({ active, mode, turn, over, promotion }) {
  return Boolean(
    active && mode === "computer" && turn === "b" && !over && !promotion,
  );
}

export function startComputerTurn({
  game,
  onMove,
  onError = () => {},
  isEligible = () => true,
  createWorker = () =>
    new Worker(new URL("./chess.worker.js", import.meta.url), {
      type: "module",
    }),
}) {
  const id = ++nextJobId;
  const fen = game.fen();
  let ended = false;
  let worker;

  function cancel() {
    ended = true;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
  }

  function fail(message) {
    if (ended) return;
    cancel();
    onError(message);
  }

  try {
    worker = createWorker();
    worker.onmessage = ({ data }) => {
      if (ended || data.id !== id) return;
      if (data.fen !== fen || game.fen() !== fen || !isEligible()) {
        cancel();
        return;
      }
      if (data.error || !data.move) {
        fail(data.error ?? "The computer could not finish this move.");
        return;
      }
      cancel();
      onMove(data.move);
    };
    worker.onerror = (event) => {
      event.preventDefault?.();
      fail("The computer is unavailable. Retry or start a two-player game.");
    };
    worker.postMessage({ id, fen, position: serializeGame(game) });
  } catch {
    fail("The computer is unavailable. Retry or start a two-player game.");
  }
  return cancel;
}
