import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../ui/Glyph";

export function Notepad({ active }) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("Untitled");
  const [wrap, setWrap] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");
  const input = useRef(null);
  const textarea = useRef(null);
  function save() {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename === "Untitled" ? "Untitled.txt" : filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenu(null);
  }
  useEffect(() => {
    if (!active) return;
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, text, filename]);
  async function openFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("File is too large.");
      return;
    }
    try {
      setText(await file.text());
      setFilename(file.name);
      setError("");
    } catch {
      setError("Could not open this file.");
    }
    event.target.value = "";
  }
  return (
    <div className="notepad">
      <div className="notepad-tab">
        <Glyph name="document" size={15} />
        {filename}
        <span />
      </div>
      <nav className="notepad-menu">
        <div>
          <button onClick={() => setMenu(menu === "file" ? null : "file")}>
            File
          </button>
          {menu === "file" && (
            <div className="app-menu shell-panel">
              <button
                onClick={() => {
                  setText("");
                  setFilename("Untitled");
                  setMenu(null);
                }}
              >
                New
              </button>
              <button
                onClick={() => {
                  input.current?.click();
                  setMenu(null);
                }}
              >
                Open
              </button>
              <button onClick={save}>Save as</button>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => {
              textarea.current?.focus();
              textarea.current?.select();
              setMenu(null);
            }}
          >
            Select all
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              setWrap((value) => !value);
              setMenu(null);
            }}
          >
            Word wrap <span>{wrap ? "✓" : ""}</span>
          </button>
        </div>
        <button
          className="icon-button"
          aria-label="Save text file"
          onClick={save}
        >
          <Glyph name="download" size={18} />
        </button>
      </nav>
      <input
        ref={input}
        type="file"
        accept=".txt,.md,.log,.csv"
        hidden
        onChange={openFile}
      />
      {error && <div className="app-error">{error}</div>}
      <textarea
        ref={textarea}
        aria-label="Text editor"
        value={text}
        onChange={(event) => setText(event.target.value)}
        wrap={wrap ? "soft" : "off"}
        spellCheck={false}
        style={{ fontSize: `${(14 * zoom) / 100}px` }}
      />
      <footer>
        <span>{text.length} characters</span>
        <button
          onClick={() => setZoom((value) => (value === 150 ? 100 : value + 25))}
        >
          {zoom}%
        </button>
        <span>Windows (CRLF)</span>
        <span>UTF-8</span>
      </footer>
    </div>
  );
}
