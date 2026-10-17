import { useEffect, useRef, useState } from "react";
import { BookCover } from "./BookCover";
import { BookPage } from "./BookPage";
import { ScreenshotViewer } from "./ScreenshotViewer";
import { PAGE_TURN_DURATION, useBookTurn } from "./useBookTurn";
import "./book-reader.css";

export function BookReader({ project, onClose, active, arriving = false }) {
  const surface = useRef(null);
  const reader = useRef(null);
  const swipe = useRef(null);
  const suppressClick = useRef(false);
  const imageOpener = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [opening, setOpening] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const total = project.images.length + 1;
  const { wide, page, turn, move, atStart, atEnd } = useBookTurn(surface, total, active && !arriving && !opening);
  useEffect(() => {
    const stride = wide ? 2 : 1;
    // Decode only the next spread while the current pages are being read.
    project.images.slice(page + stride - 1, page + stride * 2 - 1).forEach((image) => {
      const preview = new Image();
      preview.decoding = "async";
      preview.src = image.preview;
      preview.decode().catch(() => {});
    });
  }, [page, wide, project]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (media.matches) setOpening(false); };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => { reader.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    let cancelled = false;
    if (active && viewer === null) queueMicrotask(() => {
      if (!cancelled && !reader.current?.contains(document.activeElement)) reader.current?.focus({ preventScroll: true });
    });
    return () => { cancelled = true; };
  }, [active, viewer, turn]);
  useEffect(() => {
    if (viewer === null && imageOpener.current?.isConnected) imageOpener.current.focus({ preventScroll: true });
  }, [viewer]);
  function enlarge(index, opener) { imageOpener.current = opener; setViewer(index); }

  function onKeyDown(event) {
    if (!active || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  }
  return (
    <section className={`book-reader ${arriving ? "is-arriving" : ""}`} style={{ "--page-turn-duration": `${PAGE_TURN_DURATION}ms` }} ref={reader} role="region" aria-label={`${project.name} book`} tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="reader-surface" ref={surface} inert={viewer !== null}>
        <header className="reader-toolbar">
          <button onClick={onClose}><span aria-hidden="true">←</span><span>Back to shelf</span></button>
          <span className="reader-project-name">{project.name}</span>
        </header>
        <div className="book-stage">
          <div className={`book-spread ${wide ? "is-spread" : "is-single"}`}
            onPointerDown={(event) => { suppressClick.current = false; if (event.pointerType === "touch") swipe.current = { x: event.clientX, y: event.clientY }; }}
            onPointerCancel={() => { swipe.current = null; }}
            onPointerUp={(event) => {
              if (!swipe.current) return;
              const dx = event.clientX - swipe.current.x;
              const dy = event.clientY - swipe.current.y;
              swipe.current = null;
              if (Math.abs(dx) > 60 && Math.abs(dy) < 60) { suppressClick.current = true; move(dx < 0 ? 1 : -1); }
            }}
            onClickCapture={(event) => { if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } suppressClick.current = false; }}>
            <BookPage project={project} index={wide && turn?.direction > 0 ? turn.from : page} onEnlarge={enlarge} />
            {wide && <BookPage project={project} index={turn?.direction < 0 ? turn.from + 1 : page + 1} onEnlarge={enlarge} />}
            {turn && <div className={`turning-paper turn-${turn.direction > 0 ? "next" : "previous"}`} aria-hidden="true">
              <div className="turning-front"><BookPage project={project} index={turn.from + (wide && turn.direction > 0 ? 1 : 0)} decorative /></div>
              <div className="turning-back"><BookPage project={project} index={page + (wide && turn.direction < 0 ? 1 : 0)} decorative /></div>
            </div>}
            {!arriving && opening && <div className="opening-cover" aria-hidden="true" onAnimationEnd={(event) => { if (event.target === event.currentTarget) setOpening(false); }}><BookCover project={project} /></div>}
          </div>
        </div>
        <footer className="reader-controls">
          <button aria-label="Previous page" disabled={arriving || opening || atStart || !!turn} onClick={() => move(-1)}>← <span>Previous</span></button>
          <span role="status" aria-live="polite">{wide && page + 1 < total ? `${page + 1}–${page + 2}` : page + 1} / {total}</span>
          <button aria-label="Next page" disabled={arriving || opening || atEnd || !!turn} onClick={() => move(1)}><span>Next</span> →</button>
        </footer>
      </div>
      {viewer !== null && <ScreenshotViewer project={project} initialIndex={viewer} onClose={() => setViewer(null)} active={active} />}
    </section>
  );
}
