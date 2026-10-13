export const initialCalculator = {
  display: "0",
  stored: null,
  operator: null,
  waiting: false,
  expression: "",
  history: [],
};

function calculate(left, right, operator) {
  if (operator === "+") return left + right;
  if (operator === "−") return left - right;
  if (operator === "×") return left * right;
  if (operator === "÷") return right === 0 ? NaN : left / right;
  return right;
}
function format(number) {
  return Number.isFinite(number)
    ? String(Number(number.toPrecision(12)))
    : "Cannot divide by zero";
}

export function calculatorReducer(state, { key }) {
  const number = Number(state.display);
  if (/^\d$/.test(key))
    return {
      ...state,
      display:
        state.waiting || !Number.isFinite(number) || state.display === "0"
          ? key
          : (state.display + key).slice(0, 16),
      waiting: false,
    };
  if (key === ".")
    return {
      ...state,
      display: state.waiting
        ? "0."
        : state.display.includes(".")
          ? state.display
          : state.display + ".",
      waiting: false,
    };
  if (key === "C") return { ...initialCalculator, history: state.history };
  if (key === "CE") return { ...state, display: "0", waiting: false };
  if (key === "⌫")
    return {
      ...state,
      display: state.waiting ? "0" : state.display.slice(0, -1) || "0",
      waiting: false,
    };
  if (key === "±") return { ...state, display: format(-number) };
  if (key === "%")
    return {
      ...state,
      display: format(
        state.stored !== null && ["+", "−"].includes(state.operator)
          ? (state.stored * number) / 100
          : number / 100,
      ),
    };
  if (key === "x²")
    return { ...state, display: format(number * number), waiting: true };
  if (key === "√x")
    return {
      ...state,
      display: number < 0 ? "Invalid input" : format(Math.sqrt(number)),
      waiting: true,
    };
  if (key === "1/x")
    return {
      ...state,
      display: format(number === 0 ? NaN : 1 / number),
      waiting: true,
    };
  if (["+", "−", "×", "÷"].includes(key)) {
    const stored =
      state.stored !== null && state.operator && !state.waiting
        ? calculate(state.stored, number, state.operator)
        : number;
    return {
      ...state,
      display: format(stored),
      stored,
      operator: key,
      waiting: true,
      expression: `${format(stored)} ${key}`,
    };
  }
  if (
    key === "=" &&
    state.operator &&
    state.stored !== null &&
    Number.isFinite(number)
  ) {
    const result = format(calculate(state.stored, number, state.operator));
    const expression = `${format(state.stored)} ${state.operator} ${state.display} =`;
    return {
      ...state,
      display: result,
      stored: null,
      operator: null,
      waiting: true,
      expression,
      history: [{ expression, result }, ...state.history].slice(0, 30),
    };
  }
  return state;
}
