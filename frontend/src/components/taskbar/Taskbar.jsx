import { apps } from "../../data/apps";
import { useClock } from "../../hooks/useClock";
import { useDesktop } from "../../state/DesktopContext";
import { AppIcon } from "../ui/AppIcon";
import { Glyph } from "../ui/Glyph";

export function Taskbar() {
  const {
    panel,
    togglePanel,
    windows,
    activeId,
    dispatch,
    openApp,
    preferences,
  } = useDesktop();
  const now = useClock();
  const pinned = ["explorer", "store"];
  const running = windows
    .map((item) => item.appId)
    .filter((id) => !pinned.includes(id));
  function activate(id) {
    const item = windows.find((item) => item.id === id);
    if (!item) openApp(id);
    else if (activeId === id && !item.minimized)
      dispatch({ type: "minimize", id });
    else dispatch({ type: "focus", id });
  }
  return (
    <footer className="taskbar" aria-label="Taskbar">
      <button
        className={`taskbar-widget taskbar-button ${panel === "widgets" ? "pressed" : ""}`}
        aria-label="Widgets"
        title="Widgets"
        onClick={() => togglePanel("widgets")}
      >
        <Glyph name="widgets" size={24} />
      </button>
      <div className="taskbar-apps">
        <button
          className={`taskbar-button ${panel === "start" ? "pressed" : ""}`}
          aria-label="Start"
          title="Start"
          onClick={() => togglePanel("start")}
        >
          <AppIcon name="windows" size={24} />
        </button>
        <button
          className={`taskbar-button ${panel === "search" ? "pressed" : ""}`}
          aria-label="Search"
          title="Search"
          onClick={() => togglePanel("search")}
        >
          <Glyph name="search" size={24} />
        </button>
        <button
          className={`taskbar-button ${panel === "taskview" ? "pressed" : ""}`}
          aria-label="Task view"
          title="Task view"
          onClick={() => togglePanel("taskview")}
        >
          <span className="taskview-icon" />
        </button>
        {[...pinned, ...running].map((id) => (
          <button
            key={id}
            className={`taskbar-button app-task ${windows.some((item) => item.id === id) ? "running" : ""} ${activeId === id ? "active" : ""}`}
            title={apps[id].title}
            aria-label={apps[id].title}
            onClick={() => activate(id)}
          >
            <AppIcon name={apps[id].icon} size={24} />
          </button>
        ))}
      </div>
      <div className="system-tray">
        <button
          className="tray-button"
          aria-label="Hidden icons"
          title="Show hidden icons"
          onClick={() => togglePanel("tray")}
        >
          <Glyph name="up" size={16} />
        </button>
        <button
          className="tray-button tray-language"
          aria-label="Keyboard language"
          title="English (United States)"
          onClick={() => togglePanel("language")}
        >
          ENG
          <br />
          US
        </button>
        <button
          className={`tray-button quick-tray ${panel === "quick" ? "pressed" : ""}`}
          aria-label="Quick settings"
          title={`Internet access · Volume ${preferences.volume}%`}
          onClick={() => togglePanel("quick")}
        >
          <Glyph name={preferences.wifi ? "wifi" : "airplane"} size={18} />
          <Glyph name={preferences.volume ? "volume" : "mute"} size={18} />
          <Glyph name="battery" size={21} />
        </button>
        <button
          className={`tray-clock ${panel === "calendar" ? "pressed" : ""}`}
          aria-label="Date and time"
          title={now.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          onClick={() => togglePanel("calendar")}
        >
          <span>
            {now.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span>{now.toLocaleDateString("en-US")}</span>
        </button>
        <button
          className="show-desktop"
          aria-label="Show desktop"
          title="Show desktop"
          onClick={() => {
            windows
              .filter((item) => !item.minimized)
              .forEach((item) => dispatch({ type: "minimize", id: item.id }));
          }}
        />
      </div>
    </footer>
  );
}
