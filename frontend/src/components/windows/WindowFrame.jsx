import { useEffect, useRef, useState } from "react";
import { apps } from "../../data/apps";
import { useDesktop } from "../../state/DesktopContext";
import { AppIcon } from "../ui/AppIcon";
import { Glyph } from "../ui/Glyph";

export function WindowFrame({ window: item, stackOrder, children }) {
  const { dispatch, activeId, setPanel, setContextMenu } = useDesktop();
  const app = apps[item.appId];
  const frame = useRef(null);
  const gesture = useRef(null);
  const [snap, setSnap] = useState(null);
  const [snapMenu, setSnapMenu] = useState(false);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const small = viewport.width <= 600;
  const bounds =
    item.maximized || small
      ? { x: 0, y: 0, width: viewport.width, height: viewport.height - 48 }
      : {
          ...item.bounds,
          width: Math.min(item.bounds.width, viewport.width),
          height: Math.min(item.bounds.height, viewport.height - 48),
          x: Math.max(
            0,
            Math.min(
              item.bounds.x,
              viewport.width - Math.min(item.bounds.width, viewport.width),
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              item.bounds.y,
              viewport.height -
                48 -
                Math.min(item.bounds.height, viewport.height - 48),
            ),
          ),
        };

  useEffect(() => {
    const resize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (activeId === item.id && !item.minimized)
      frame.current?.focus({ preventScroll: true });
  }, [activeId, item.id, item.minimized]);

  function startGesture(event, edge) {
    if (event.button !== 0 || small || event.target.closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      bounds: { ...bounds },
      edge,
    };
    if (item.maximized && !edge) {
      const restored = {
        ...item.bounds,
        x: Math.max(0, event.clientX - item.bounds.width / 2),
        y: Math.max(0, event.clientY - 16),
      };
      dispatch({ type: "bounds", id: item.id, bounds: restored });
      gesture.current.bounds = restored;
    }
  }

  function moveGesture(event) {
    const drag = gesture.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const next = { ...drag.bounds };
    if (!drag.edge) {
      next.x = Math.max(
        -next.width + 120,
        Math.min(viewport.width - 120, next.x + dx),
      );
      next.y = Math.max(0, Math.min(viewport.height - 96, next.y + dy));
      setSnap(
        event.clientY <= 6
          ? "top"
          : event.clientX <= 6
            ? "left"
            : event.clientX >= viewport.width - 6
              ? "right"
              : null,
      );
    } else {
      if (drag.edge.includes("e"))
        next.width = Math.max(
          Math.min(320, viewport.width),
          Math.min(viewport.width - next.x, drag.bounds.width + dx),
        );
      if (drag.edge.includes("s"))
        next.height = Math.max(
          240,
          Math.min(viewport.height - next.y - 48, drag.bounds.height + dy),
        );
      if (drag.edge.includes("w")) {
        next.x = Math.max(
          0,
          Math.min(drag.bounds.x + dx, drag.bounds.x + drag.bounds.width - 320),
        );
        next.width = drag.bounds.width + drag.bounds.x - next.x;
      }
      if (drag.edge.includes("n")) {
        next.y = Math.max(
          0,
          Math.min(
            drag.bounds.y + dy,
            drag.bounds.y + drag.bounds.height - 240,
          ),
        );
        next.height = drag.bounds.height + drag.bounds.y - next.y;
      }
    }
    dispatch({ type: "bounds", id: item.id, bounds: next });
  }

  function snapTo(position) {
    if (position === "top") dispatch({ type: "maximize", id: item.id });
    else
      dispatch({
        type: "bounds",
        id: item.id,
        bounds: {
          x: position === "left" ? 0 : viewport.width / 2,
          y: 0,
          width: viewport.width / 2,
          height: viewport.height - 48,
        },
      });
    setSnapMenu(false);
  }

  function endGesture() {
    if (!gesture.current) return;
    if (snap) snapTo(snap);
    gesture.current = null;
    setSnap(null);
  }

  return (
    <>
      {snap && <div className={`snap-preview snap-${snap}`} />}
      <section
        ref={frame}
        role="dialog"
        aria-label={app.title}
        tabIndex={-1}
        className={`app-window ${activeId === item.id ? "active" : ""} ${item.maximized || small ? "maximized" : ""} app-${item.appId}`}
        hidden={item.minimized}
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          zIndex: stackOrder,
        }}
        onPointerDownCapture={() => {
          if (activeId !== item.id) dispatch({ type: "focus", id: item.id });
          setPanel(null);
          setContextMenu(null);
        }}
      >
        <header
          className="window-titlebar"
          onPointerDown={(event) => startGesture(event)}
          onPointerMove={moveGesture}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onDoubleClick={(event) => {
            if (!event.target.closest("button"))
              dispatch({ type: "maximize", id: item.id });
          }}
        >
          <span className="window-title">
            <AppIcon name={app.icon} size={16} />
            <span>{app.title}</span>
          </span>
          <div className="window-controls">
            <button
              title="Minimize"
              aria-label="Minimize"
              onClick={() => dispatch({ type: "minimize", id: item.id })}
            >
              <Glyph name="minimize" size={16} />
            </button>
            <div
              className="maximize-control"
              onMouseEnter={() => setSnapMenu(true)}
              onMouseLeave={() => setSnapMenu(false)}
            >
              <button
                title={item.maximized ? "Restore Down" : "Maximize"}
                aria-label={item.maximized ? "Restore" : "Maximize"}
                onClick={() => dispatch({ type: "maximize", id: item.id })}
              >
                <Glyph
                  name={item.maximized ? "restore" : "maximize"}
                  size={14}
                />
              </button>
              {snapMenu && !small && (
                <div className="snap-layouts">
                  <button
                    aria-label="Snap left"
                    onClick={() => snapTo("left")}
                  />
                  <button
                    aria-label="Snap right"
                    onClick={() => snapTo("right")}
                  />
                </div>
              )}
            </div>
            <button
              className="close-button"
              title="Close"
              aria-label="Close"
              onClick={() => dispatch({ type: "close", id: item.id })}
            >
              <Glyph name="close" size={16} />
            </button>
          </div>
        </header>
        <div className="window-content">{children}</div>
        {!item.maximized &&
          !small &&
          ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((edge) => (
            <div
              key={edge}
              className={`resize-handle resize-${edge}`}
              onPointerDown={(event) => startGesture(event, edge)}
              onPointerMove={moveGesture}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
            />
          ))}
      </section>
    </>
  );
}
