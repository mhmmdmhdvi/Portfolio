import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const PAGE_TURN_DURATION = 1050;

export function useBookTurn(surface, total, active) {
  const [wide, setWide] = useState(false);
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(null);
  const timer = useRef(null);
  const stride = wide ? 2 : 1;
  const last = Math.floor((total - 1) / stride) * stride;

  useLayoutEffect(() => {
    setWide(surface.current.clientWidth >= 720);
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 720));
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, [surface]);
  useEffect(() => {
    clearTimeout(timer.current);
    setTurn(null);
    setPage((current) => current - current % stride);
  }, [stride]);
  useEffect(() => {
    if (!active) { clearTimeout(timer.current); setTurn(null); }
  }, [active]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function move(direction) {
    if (turn || !active) return;
    const next = Math.max(0, Math.min(last, page + direction * stride));
    if (next === page) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTurn({ from: page, direction });
      timer.current = setTimeout(() => setTurn(null), PAGE_TURN_DURATION);
    }
    setPage(next);
  }
  return { wide, page, turn, move, atStart: page === 0, atEnd: page >= last };
}
