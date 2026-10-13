import { apps } from "../../data/apps";
import { useDesktop } from "../../state/DesktopContext";
import { AppIcon } from "../ui/AppIcon";
import { Glyph } from "../ui/Glyph";
import { CalendarPanel } from "./CalendarPanel";
import { ContextMenu } from "./ContextMenu";
import { QuickSettings } from "./QuickSettings";
import { StartMenu } from "./StartMenu";

export function ShellPanels() {
  const {
    panel,
    setPanel,
    windows,
    dispatch,
    openApp,
    contextMenu,
    setContextMenu,
  } = useDesktop();
  return (
    <>
      {(panel || contextMenu) && (
        <div
          className="panel-backdrop"
          onPointerDown={() => {
            setPanel(null);
            setContextMenu(null);
          }}
        />
      )}
      {(panel === "start" || panel === "search") && (
        <StartMenu key={panel} searchMode={panel === "search"} />
      )}
      {panel === "quick" && <QuickSettings />}
      {panel === "calendar" && <CalendarPanel />}
      {panel === "widgets" && (
        <aside className="widgets-panel shell-panel">
          <div className="widgets-heading">
            <strong>Widgets</strong>
            <button
              className="icon-button"
              aria-label="Close widgets"
              onClick={() => setPanel(null)}
            >
              <Glyph name="close" size={18} />
            </button>
          </div>
          <CalendarPanel widget />
          <button className="widget-app" onClick={() => openApp("calculator")}>
            <AppIcon name="calculator" size={36} />
            Calculator
            <Glyph name="chevron" size={16} />
          </button>
        </aside>
      )}
      {panel === "taskview" && (
        <section className="task-view" aria-label="Task view">
          <div className="task-view-windows">
            {windows.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  dispatch({ type: "focus", id: item.id });
                  setPanel(null);
                }}
              >
                <header>
                  <AppIcon name={apps[item.appId].icon} size={20} />
                  {apps[item.appId].title}
                </header>
                <div>
                  <AppIcon name={apps[item.appId].icon} size={64} />
                </div>
              </button>
            ))}
            {!windows.length && (
              <span className="task-view-empty">No open windows</span>
            )}
          </div>
          <footer>
            <span className="virtual-desktop">
              <img src="/assets/wallpapers/bloom-light.jpg" alt="" />
              <strong>Desktop 1</strong>
            </span>
          </footer>
        </section>
      )}
      {panel === "tray" && (
        <div className="hidden-tray shell-panel">
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => openApp("settings")}
          >
            <AppIcon name="settings" size={24} />
          </button>
        </div>
      )}
      {panel === "language" && (
        <div className="language-panel shell-panel">
          <strong>Keyboard layout</strong>
          <button onClick={() => setPanel(null)}>
            <span>ENG</span>
            <span>
              English (United States)<small>US</small>
            </span>
            <Glyph name="check" size={16} />
          </button>
        </div>
      )}
      <ContextMenu />
    </>
  );
}
