import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../ui/Glyph";

export function Paint() {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const snapshots = useRef([]);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  useEffect(() => {
    const context = canvas.current.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 1000, 650);
  }, []);
  function point(event) {
    const rect = canvas.current.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * canvas.current.width) / rect.width,
      ((event.clientY - rect.top) * canvas.current.height) / rect.height,
    ];
  }
  function start(event) {
    if (event.button !== 0) return;
    const context = canvas.current.getContext("2d");
    snapshots.current = [
      ...snapshots.current.slice(-15),
      context.getImageData(0, 0, 1000, 650),
    ];
    drawing.current = true;
    canvas.current.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(...point(event));
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(...point(event).map((value) => value + 0.1));
    context.stroke();
  }
  function draw(event) {
    if (drawing.current) {
      const context = canvas.current.getContext("2d");
      context.lineTo(...point(event));
      context.stroke();
    }
  }
  function download() {
    canvas.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Untitled.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  return (
    <div className="paint">
      <div className="paint-toolbar">
        <button className="small-button" onClick={download}>
          <Glyph name="download" size={16} />
          Save
        </button>
        <button
          className="icon-button"
          aria-label="Undo"
          onClick={() => {
            const previous = snapshots.current.pop();
            if (previous)
              canvas.current.getContext("2d").putImageData(previous, 0, 0);
          }}
        >
          <Glyph name="back" size={17} />
        </button>
        <button
          className="small-button"
          onClick={() => {
            const context = canvas.current.getContext("2d");
            snapshots.current.push(context.getImageData(0, 0, 1000, 650));
            context.fillStyle = "#fff";
            context.fillRect(0, 0, 1000, 650);
          }}
        >
          Clear
        </button>
        <label>
          Size{" "}
          <input
            type="range"
            min="1"
            max="30"
            aria-label="Brush size"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </label>
        <input
          type="color"
          aria-label="Brush color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
        <div className="paint-colors">
          {[
            "#000000",
            "#808080",
            "#ffffff",
            "#b80000",
            "#ff0000",
            "#ff9800",
            "#ffd600",
            "#00a651",
            "#00a2e8",
            "#3f48cc",
            "#a349a4",
          ].map((value) => (
            <button
              key={value}
              aria-label={`Color ${value}`}
              style={{ background: value }}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
      </div>
      <div className="paint-workspace">
        <canvas
          ref={canvas}
          width="1000"
          height="650"
          aria-label="Drawing canvas"
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        />
      </div>
      <footer>
        1000 × 650px <span>100%</span>
      </footer>
    </div>
  );
}
