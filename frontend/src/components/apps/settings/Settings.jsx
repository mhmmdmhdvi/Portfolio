import { useEffect, useState } from "react";
import { getWallpaper, wallpapers } from "../../../data/wallpapers";
import { useDesktop } from "../../../state/DesktopContext";
import { Glyph } from "../../ui/Glyph";

export function Settings({ section: initialSection = "system" }) {
  const { preferences, updatePreferences } = useDesktop();
  const [section, setSection] = useState(initialSection);
  const [query, setQuery] = useState("");
  useEffect(() => setSection(initialSection), [initialSection]);
  const sections = [
    { id: "system", title: "System", icon: "desktop" },
    { id: "personalization", title: "Personalization", icon: "image" },
    { id: "accessibility", title: "Accessibility", icon: "user" },
  ];
  return (
    <div className="settings">
      <aside>
        <div className="settings-profile">
          <span className="user-avatar">
            <Glyph name="user" size={30} />
          </span>
          <div>
            <strong>User</strong>
            <small>Local account</small>
          </div>
        </div>
        <label className="settings-search">
          <input
            aria-label="Find a setting"
            placeholder="Find a setting"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Glyph name="search" size={16} />
        </label>
        <nav>
          {sections
            .filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase()),
            )
            .map((item) => (
              <button
                key={item.id}
                className={section === item.id ? "selected" : ""}
                onClick={() => setSection(item.id)}
              >
                <Glyph name={item.icon} size={20} />
                {item.title}
              </button>
            ))}
        </nav>
      </aside>
      <main>
        <h1>
          {sections.find((item) => item.id === section)?.title ?? "System"}
        </h1>
        {section === "system" && (
          <>
            <div className="settings-device">
              <img
                src={getWallpaper(preferences.wallpaper).src}
                alt=""
              />
              <div>
                <strong>Desktop</strong>
                <span>Windows 11</span>
              </div>
            </div>
            <h2>Display</h2>
            <div className="setting-card">
              <Glyph name="sun" size={24} />
              <div>
                <strong>Brightness</strong>
              </div>
              <input
                aria-label="Display brightness"
                type="range"
                min="30"
                max="100"
                value={preferences.brightness}
                onChange={(event) =>
                  updatePreferences({ brightness: Number(event.target.value) })
                }
              />
            </div>
            <div className="setting-card">
              <Glyph name="moon" size={24} />
              <div>
                <strong>Night light</strong>
              </div>
              <button
                className={`toggle-switch ${preferences.nightLight ? "on" : ""}`}
                role="switch"
                aria-label="Night light"
                aria-checked={preferences.nightLight}
                onClick={() =>
                  updatePreferences({ nightLight: !preferences.nightLight })
                }
              />
            </div>
            <h2>Sound</h2>
            <div className="setting-card">
              <Glyph name="volume" size={24} />
              <div>
                <strong>Volume</strong>
              </div>
              <input
                type="range"
                aria-label="System volume"
                min="0"
                max="100"
                value={preferences.volume}
                onChange={(event) =>
                  updatePreferences({ volume: Number(event.target.value) })
                }
              />
            </div>
          </>
        )}
        {section === "personalization" && (
          <>
            <div className="theme-preview">
              <img
                src={getWallpaper(preferences.wallpaper).src}
                alt="Current background"
              />
              <div />
              <span />
            </div>
            <h2>Select a theme to apply</h2>
            <div className="theme-options">
              {["light", "dark"].map((theme) => (
                <button
                  key={theme}
                  aria-label={`${theme === "light" ? "Light" : "Dark"} theme`}
                  className={preferences.theme === theme ? "chosen" : ""}
                  onClick={() =>
                    updatePreferences({ theme })
                  }
                >
                  <img src={getWallpaper(preferences.wallpaper).src} alt="" />
                  <span>{theme === "light" ? "Light" : "Dark"}</span>
                </button>
              ))}
            </div>
            <div className="setting-card">
              <Glyph name="image" size={24} />
              <div>
                <strong>Background</strong>
              </div>
              <select
                aria-label="Background"
                value={preferences.wallpaper}
                onChange={(event) =>
                  updatePreferences({ wallpaper: event.target.value })
                }
              >
                {wallpapers.map((wallpaper) => (
                  <option key={wallpaper.id} value={wallpaper.id}>{wallpaper.label}</option>
                ))}
              </select>
            </div>
            <div className="setting-card">
              <Glyph name="sun" size={24} />
              <div>
                <strong>Choose your mode</strong>
              </div>
              <select
                aria-label="Color mode"
                value={preferences.theme}
                onChange={(event) =>
                  updatePreferences({ theme: event.target.value })
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </>
        )}
        {section === "accessibility" && (
          <>
            <h2>Vision</h2>
            <div className="setting-card">
              <Glyph name="grid" size={24} />
              <div>
                <strong>Desktop icon size</strong>
              </div>
              <select
                aria-label="Desktop icon size"
                value={preferences.iconSize}
                onChange={(event) =>
                  updatePreferences({ iconSize: event.target.value })
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="setting-card">
              <Glyph name="desktop" size={24} />
              <div>
                <strong>Show desktop icons</strong>
              </div>
              <button
                className={`toggle-switch ${preferences.showIcons ? "on" : ""}`}
                role="switch"
                aria-label="Show desktop icons"
                aria-checked={preferences.showIcons}
                onClick={() =>
                  updatePreferences({ showIcons: !preferences.showIcons })
                }
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
