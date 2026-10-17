import { useEffect, useRef, useState } from "react";

export function ScreenshotViewer({ project, initialIndex, onClose, active }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const dialog = useRef(null);
  const scroll = useRef(null);
  const image = project.images[index];
  useEffect(() => {
    let cancelled = false;
    if (active) queueMicrotask(() => {
      if (!cancelled && (!dialog.current?.contains(document.activeElement) || document.activeElement.matches(":disabled"))) dialog.current?.querySelector("button")?.focus();
    });
    return () => { cancelled = true; };
  }, [active, index]);
  useEffect(() => {
    setFailed(false);
    setRetry(0);
    setZoomed(false);
    scroll.current?.scrollTo(0, 0);
  }, [index]);
  function move(direction) { setIndex((current) => Math.max(0, Math.min(project.images.length - 1, current + direction))); }
  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "Tab") {
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (!controls.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  return (
    <div className="screenshot-viewer" ref={dialog} role="dialog" aria-modal={active ? true : undefined} aria-label="Screenshot viewer" onKeyDown={onKeyDown}>
      <header className="viewer-toolbar">
        <button onClick={onClose}>Close image</button>
        <span>{image.caption} <small>{index + 1} / {project.images.length}</small></span>
        <button onClick={() => setZoomed((value) => !value)} aria-pressed={zoomed}>{zoomed ? "Fit width" : "Actual size"}</button>
      </header>
      <div className={`viewer-scroll ${zoomed ? "is-zoomed" : ""}`} ref={scroll} tabIndex={0} aria-label="Screenshot">
        {failed ? (
          <div className="image-error"><p>Image unavailable.</p><button onClick={() => { setFailed(false); setRetry((value) => value + 1); }}>Reload image</button></div>
        ) : (
          <img key={`${index}-${retry}`} src={image.full + (retry ? `?retry=${retry}` : "")} alt={`${project.name} — ${image.caption}`} width={image.width} height={image.height} decoding="async" draggable="false" onError={() => setFailed(true)} />
        )}
      </div>
      <footer className="viewer-controls">
        <button onClick={() => move(-1)} disabled={index === 0}>Previous image</button>
        <button onClick={() => move(1)} disabled={index === project.images.length - 1}>Next image</button>
      </footer>
    </div>
  );
}
