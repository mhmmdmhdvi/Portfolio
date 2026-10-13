import { useEffect, useReducer, useState } from "react";
import { Glyph } from "../../ui/Glyph";
import { calculatorReducer, initialCalculator } from "./calculatorState";

const keys = [
  "%",
  "CE",
  "C",
  "⌫",
  "1/x",
  "x²",
  "√x",
  "÷",
  "7",
  "8",
  "9",
  "×",
  "4",
  "5",
  "6",
  "−",
  "1",
  "2",
  "3",
  "+",
  "±",
  "0",
  ".",
  "=",
];

export function Calculator({ active }) {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculator);
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          event.target.closest("input, textarea, select"))
      )
        return;
      const key =
        {
          "*": "×",
          "/": "÷",
          "-": "−",
          Enter: "=",
          Escape: "C",
          Backspace: "⌫",
        }[event.key] ?? event.key;
      if (
        keys.includes(key) &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        dispatch({ key });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
  return (
    <div className="calculator">
      <header>
        <strong>Standard</strong>
        <button
          className="icon-button"
          title="History"
          aria-label="History"
          onClick={() => setShowHistory((value) => !value)}
        >
          <Glyph name="refresh" size={20} />
        </button>
      </header>
      <div className="calculator-expression">{state.expression}</div>
      <output
        className={`calculator-display ${state.display.length > 12 ? "long" : ""}`}
        aria-label="Result"
      >
        {state.display}
      </output>
      {showHistory ? (
        <div className="calculator-history">
          {state.history.length ? (
            state.history.map((item, i) => (
              <div key={i}>
                <small>{item.expression}</small>
                <strong>{item.result}</strong>
              </div>
            ))
          ) : (
            <span>There’s no history yet.</span>
          )}
        </div>
      ) : (
        <div className="calculator-keys">
          {keys.map((key) => (
            <button
              key={key}
              className={`${/^\d$/.test(key) || key === "." || key === "±" ? "number-key" : ""} ${key === "=" ? "equals-key" : ""}`}
              onClick={() => dispatch({ key })}
            >
              {key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
