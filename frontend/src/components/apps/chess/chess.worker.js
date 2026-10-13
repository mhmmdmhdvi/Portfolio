import { chooseComputerMove } from "./ai";

self.onmessage = ({ data }) => {
  const { id, position, fen } = data;
  try {
    self.postMessage({ id, fen, move: chooseComputerMove(position) });
  } catch {
    self.postMessage({
      id,
      fen,
      error: "The computer could not finish this move.",
    });
  }
};
