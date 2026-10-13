import { useEffect, useRef } from "react";

export function useAnimationLoop(callback, enabled) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!enabled) return;
    let frame;
    let previous;
    function tick(time) {
      const seconds =
        previous === undefined ? 0 : Math.min((time - previous) / 1000, 0.032);
      previous = time;
      callbackRef.current(seconds);
      frame = requestAnimationFrame(tick);
    }
    function visibilityChanged() {
      cancelAnimationFrame(frame);
      previous = undefined;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }
    if (!document.hidden) frame = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [enabled]);
}
