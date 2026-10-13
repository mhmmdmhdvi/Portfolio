import { expect, it } from "vitest";
import { calculatorReducer, initialCalculator } from "./calculatorState.js";

function press(keys) {
  return keys.reduce(
    (state, key) => calculatorReducer(state, { key }),
    initialCalculator,
  );
}
it("calculates chained operations without executing expressions", () => {
  expect(press(["2", "+", "3", "×", "4", "="]).display).toBe("20");
});
it("replaces the previous result when entering a new number", () => {
  expect(press(["2", "+", "3", "=", "7"]).display).toBe("7");
});
it("handles division by zero without producing Infinity", () => {
  expect(press(["8", "÷", "0", "="]).display).toBe("Cannot divide by zero");
});
it("prevents multiple decimal points in one number", () => {
  expect(press(["1", ".", "2", ".", "3"]).display).toBe("1.23");
});
