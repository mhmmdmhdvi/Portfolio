import { useState } from "react";
import { useDesktop } from "../../state/DesktopContext";
import { AppIcon } from "../ui/AppIcon";

const icons = [
  { name: "Recycle Bin", icon: "bin0", app: "recycle-bin" },
  { name: "سرگرمی", icon: "folder", app: "explorer", path: "entertainment" },
  { name: "This PC", icon: "pc", app: "explorer", path: "this-pc" },
];

export function Desktop() {
  const { openApp, setPanel, setContextMenu, preferences } = useDesktop();
  const [selected, setSelected] = useState(null);
  return (
    <main
      className={`desktop desktop-icons-${preferences.iconSize}`}
      aria-label="Desktop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          setSelected(null);
          setPanel(null);
          setContextMenu(null);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setPanel(null);
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      {preferences.showIcons && (
        <div className="desktop-icons">
          {icons.map((item) => (
            <button
              key={item.name}
              className={`desktop-icon ${selected === item.name ? "selected" : ""}`}
              aria-label={item.name}
              onClick={(event) => {
                event.stopPropagation();
                setSelected(item.name);
                setPanel(null);
                if (
                  window.matchMedia("(pointer: coarse)").matches ||
                  window.innerWidth <= 600
                )
                  openApp(
                    item.app,
                    item.path ? { path: item.path } : undefined,
                  );
              }}
              onDoubleClick={() =>
                openApp(item.app, item.path ? { path: item.path } : undefined)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openApp(
                    item.app,
                    item.path ? { path: item.path } : undefined,
                  );
                }
              }}
            >
              <AppIcon
                name={item.icon}
                size={
                  preferences.iconSize === "large"
                    ? 48
                    : preferences.iconSize === "small"
                      ? 24
                      : 40
                }
              />
              <span dir="auto">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
