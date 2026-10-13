import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../ui/Glyph";

export function Photos() {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const input = useRef(null);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );
  function open(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      file.size > 32 * 1024 * 1024
    ) {
      setError("This file cannot be opened.");
      return;
    }
    setPhoto({ name: file.name, url: URL.createObjectURL(file) });
    setZoom(1);
    setError(null);
    event.target.value = "";
  }
  return (
    <div className="photos">
      <header>
        <strong>{photo?.name ?? "Gallery"}</strong>
        <button className="small-button" onClick={() => input.current?.click()}>
          <Glyph name="folder" size={16} />
          Open
        </button>
        {photo && (
          <button
            className="small-button"
            onClick={() => setZoom((value) => (value >= 2 ? 1 : value + 0.25))}
          >
            {Math.round(zoom * 100)}%
          </button>
        )}
      </header>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={open}
      />
      <div className="photo-view">
        {error && <p role="alert">{error}</p>}
        {photo ? (
          <img
            src={photo.url}
            alt={photo.name}
            style={{ transform: `scale(${zoom})` }}
          />
        ) : (
          <button onClick={() => input.current?.click()}>
            <Glyph name="image" size={64} />
            <span>Open a photo</span>
          </button>
        )}
      </div>
    </div>
  );
}
