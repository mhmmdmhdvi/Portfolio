import { useState } from "react";
import { useDesktop } from "../../state/DesktopContext";
import { Glyph } from "../ui/Glyph";

export function ContextMenu() {
  const {
    contextMenu,
    setContextMenu,
    preferences,
    updatePreferences,
    openApp,
  } = useDesktop();
  const [submenu, setSubmenu] = useState(null);
  if (!contextMenu) return null;
  const x = Math.max(8, Math.min(contextMenu.x, window.innerWidth - 300));
  const y = Math.max(8, Math.min(contextMenu.y, window.innerHeight - 370));
  function action(callback) {
    callback();
    setContextMenu(null);
  }
  return (
    <div
      className="desktop-context shell-panel"
      role="menu"
      aria-label="Desktop menu"
      style={{ left: x, top: y }}
    >
      <div
        className="context-submenu-container"
        onMouseEnter={() => setSubmenu("view")}
        onMouseLeave={() => setSubmenu(null)}
      >
        <button
          role="menuitem"
          onClick={() => setSubmenu(submenu === "view" ? null : "view")}
        >
          <Glyph name="grid" size={17} />
          <span>View</span>
          <Glyph name="chevron" size={12} />
        </button>
        {submenu === "view" && (
          <div className="context-submenu shell-panel">
            {["large", "medium", "small"].map((size) => (
              <button
                key={size}
                role="menuitemradio"
                aria-checked={preferences.iconSize === size}
                onClick={() =>
                  action(() => updatePreferences({ iconSize: size }))
                }
              >
                <span className="menu-check">
                  {preferences.iconSize === size && (
                    <Glyph name="check" size={14} />
                  )}
                </span>
                {size[0].toUpperCase() + size.slice(1)} icons
              </button>
            ))}
            <hr />
            <button
              onClick={() =>
                action(() =>
                  updatePreferences({ showIcons: !preferences.showIcons }),
                )
              }
            >
              <span className="menu-check">
                {preferences.showIcons && <Glyph name="check" size={14} />}
              </span>
              Show desktop icons
            </button>
          </div>
        )}
      </div>
      <button role="menuitem" onClick={() => action(() => {})}>
        <Glyph name="refresh" size={17} />
        <span>Refresh</span>
      </button>
      <hr />
      <button
        role="menuitem"
        onClick={() => action(() => openApp("explorer", { path: "desktop" }))}
      >
        <Glyph name="folder" size={17} />
        <span>Open in File Explorer</span>
      </button>
      <hr />
      <button
        role="menuitem"
        onClick={() => action(() => openApp("settings", { section: "system" }))}
      >
        <Glyph name="desktop" size={17} />
        <span>Display settings</span>
      </button>
      <button
        role="menuitem"
        onClick={() =>
          action(() => openApp("settings", { section: "personalization" }))
        }
      >
        <Glyph name="image" size={17} />
        <span>Personalize</span>
      </button>
      <hr />
      <button role="menuitem" onClick={() => action(() => openApp("terminal"))}>
        <Glyph name="document" size={17} />
        <span>Open in Terminal</span>
      </button>
    </div>
  );
}
