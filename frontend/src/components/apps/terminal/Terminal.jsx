import { useEffect, useRef, useState } from "react";
import { apps } from "../../../data/apps";
import { useDesktop } from "../../../state/DesktopContext";

export function Terminal({ active }) {
  const { openApp, preferences, updatePreferences } = useDesktop();
  const [lines, setLines] = useState([]);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const historyIndex = useRef(0);
  const input = useRef(null);
  const scroll = useRef(null);
  useEffect(() => {
    scroll.current?.scrollTo(0, scroll.current.scrollHeight);
    if (active) input.current?.focus();
  }, [lines, active]);
  function submit(event) {
    event.preventDefault();
    const trimmed = command.trim();
    if (!trimmed) return;
    const [name, ...args] = trimmed.split(/\s+/);
    const value = args.join(" ");
    let output;
    switch (name.toLowerCase()) {
      case "help":
        output =
          "help     List commands\nclear    Clear the screen\nls       List apps\npwd      Current directory\ndate     Current date and time\necho     Print text\nopen     Open an app: open notepad\ntheme    Set light or dark mode";
        break;
      case "clear":
        setLines([]);
        setCommand("");
        return;
      case "ls":
        output = Object.keys(apps).join("   ");
        break;
      case "pwd":
        output = "C:\\Users\\User\\Desktop";
        break;
      case "date":
        output = new Date().toLocaleString();
        break;
      case "echo":
        output = value;
        break;
      case "open":
        if (apps[value]) {
          openApp(value);
          output = "";
        } else output = "App not found.";
        break;
      case "theme":
        if (["light", "dark"].includes(value)) {
          updatePreferences({ theme: value });
          output = "";
        } else output = `Current theme: ${preferences.theme}`;
        break;
      default:
        output = `'${name}' is not recognized as a command. Type help for available commands.`;
    }
    setLines((previous) =>
      [...previous, { command: trimmed, output }].slice(-200),
    );
    setHistory((previous) => [...previous, trimmed].slice(-100));
    historyIndex.current = history.length + 1;
    setCommand("");
  }
  return (
    <div
      className="terminal"
      ref={scroll}
      onClick={() => input.current?.focus()}
    >
      <div className="terminal-tab">Terminal</div>
      {lines.map((line, index) => (
        <div key={index}>
          <div>
            <span className="terminal-prompt">PS C:\Users\User&gt;</span>{" "}
            {line.command}
          </div>
          {line.output && <pre>{line.output}</pre>}
        </div>
      ))}
      <form onSubmit={submit}>
        <label className="terminal-prompt" htmlFor="terminal-input">
          PS C:\Users\User&gt;
        </label>
        <input
          ref={input}
          id="terminal-input"
          aria-label="Terminal command"
          autoComplete="off"
          spellCheck={false}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              historyIndex.current = Math.max(0, historyIndex.current - 1);
              setCommand(history[historyIndex.current] ?? "");
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              historyIndex.current = Math.min(
                history.length,
                historyIndex.current + 1,
              );
              setCommand(history[historyIndex.current] ?? "");
            }
          }}
        />
      </form>
    </div>
  );
}
