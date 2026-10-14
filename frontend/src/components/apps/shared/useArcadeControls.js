import { useEffect, useRef, useState } from "react";

const emptyInput = () => ({ left: false, right: false, pointerX: null });
const movement = { arrowleft: "left", a: "left", arrowright: "right", d: "right" };

export function useArcadeControls({ active, input, canvas, actions }) {
  const sources = useRef({ left: new Set(), right: new Set() });
  const [pressed, setPressed] = useState({ left: false, right: false });

  function hold(side, source, down) {
    if (down) {
      if (!active) return;
      sources.current[side].add(source);
      input.current.pointerX = null;
    } else sources.current[side].delete(source);
    input.current[side] = sources.current[side].size > 0;
    setPressed((previous) => previous[side] === input.current[side]
      ? previous : { ...previous, [side]: input.current[side] });
  }

  function clear() {
    sources.current.left.clear();
    sources.current.right.clear();
    input.current = emptyInput();
    setPressed((previous) => previous.left || previous.right
      ? { left: false, right: false } : previous);
  }

  useEffect(() => {
    clear();
    if (!active) return;
    function keydown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.(
        "input, textarea, select, [contenteditable='true']",
      )) return;
      const key = event.key.toLowerCase();
      if (movement[key]) {
        event.preventDefault();
        hold(movement[key], key, true);
      } else if (key === " " && !event.repeat && !event.target.closest?.("button")) {
        event.preventDefault();
        actions.current.launchBall();
      } else if (key === "p" && !event.repeat) {
        event.preventDefault();
        actions.current.pause();
      }
    }
    function keyup(event) {
      const key = event.key.toLowerCase();
      if (movement[key]) hold(movement[key], key, false);
    }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      clear();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [active]);

  function buttonProps(side) {
    const source = `button-${side}`;
    const release = () => hold(side, source, false);
    return {
      "aria-pressed": pressed[side],
      onPointerDown: (event) => {
        event.preventDefault();
        canvas.current?.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        hold(side, source, true);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
      onBlur: release,
      onKeyDown: (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        hold(side, source, true);
      },
      onKeyUp: (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        release();
      },
    };
  }
  return { buttonProps, clear };
}
