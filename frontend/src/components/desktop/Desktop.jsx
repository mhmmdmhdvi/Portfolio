import { useState } from "react";
import { useDesktop } from "../../state/DesktopContext";
import { DesktopIcon } from "./DesktopIcon";
import { getWallpaper } from "../../data/wallpapers";
import { DesktopWelcome } from "./DesktopWelcome";

const icons = [
  { name: "This PC", icon: "pc", app: "explorer", path: "this-pc" },
  { name: "Recycle Bin", icon: "bin0", app: "recycle-bin" },
  { name: "Games", icon: "folder", app: "explorer", path: "games" },
  { name: "Resume", icon: "pdf", app: "resume" },
  { name: "Contact Me", icon: "contact", app: "contact" },
  { name: "GitHub", icon: "github", href: "https://github.com/mhmmdmhdvi" },
];

export function Desktop() {
  const { openApp, setPanel, setContextMenu, preferences } = useDesktop();
  const [selected, setSelected] = useState(null);
  function select(name) {
    setSelected(name);
    setPanel(null);
  }
  function open(item) {
    openApp(item.app, item.path ? { path: item.path } : undefined);
  }
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
      {getWallpaper(preferences.wallpaper).introduction && <DesktopWelcome />}
      {preferences.showIcons && (
        <div className="desktop-icons" style={{ "--desktop-icon-count": icons.length }}>
          {icons.map((item) => (
            <DesktopIcon
              key={item.name}
              item={item}
              selected={selected === item.name}
              onSelect={select}
              onOpen={open}
              size={
                preferences.iconSize === "large"
                  ? 48
                  : preferences.iconSize === "small"
                    ? 24
                    : 40
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
