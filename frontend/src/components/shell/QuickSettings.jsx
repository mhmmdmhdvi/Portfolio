import { useDesktop } from "../../state/DesktopContext";
import { Glyph } from "../ui/Glyph";

export function QuickSettings() {
  const { preferences, updatePreferences, openApp } = useDesktop();
  const toggles = [
    { key: "wifi", name: "Wi-Fi", icon: "wifi" },
    { key: "bluetooth", name: "Bluetooth", icon: "bluetooth" },
    { key: "airplane", name: "Airplane mode", icon: "airplane" },
    { key: "nightLight", name: "Night light", icon: "moon" },
    { key: "dark", name: "Dark mode", icon: "sun" },
    { key: "batterySaver", name: "Battery saver", icon: "battery" },
  ];
  function enabled(key) {
    return key === "dark"
      ? preferences.theme === "dark"
      : key === "airplane"
        ? !preferences.wifi
        : !!preferences[key];
  }
  function toggle(key) {
    if (key === "dark")
      updatePreferences({
        theme: preferences.theme === "dark" ? "light" : "dark",
      });
    else if (key === "airplane")
      updatePreferences({ wifi: !preferences.wifi, bluetooth: false });
    else updatePreferences({ [key]: !preferences[key] });
  }
  return (
    <section
      className="quick-settings shell-panel"
      role="dialog"
      aria-label="Quick settings"
    >
      <div className="quick-grid">
        {toggles.map((item) => (
          <div key={item.key}>
            <button
              aria-label={item.name}
              aria-pressed={enabled(item.key)}
              className={enabled(item.key) ? "enabled" : ""}
              onClick={() => toggle(item.key)}
            >
              <Glyph name={item.icon} size={21} />
            </button>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <div className="quick-sliders">
        <label>
          <Glyph name="sun" size={21} />
          <input
            type="range"
            min="30"
            max="100"
            aria-label="Brightness"
            value={preferences.brightness}
            onChange={(event) =>
              updatePreferences({ brightness: Number(event.target.value) })
            }
          />
        </label>
        <label>
          <button
            className="icon-button"
            aria-label="Mute"
            onClick={() =>
              updatePreferences({ volume: preferences.volume ? 0 : 65 })
            }
          >
            <Glyph name={preferences.volume ? "volume" : "mute"} size={21} />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            aria-label="Volume"
            value={preferences.volume}
            onChange={(event) =>
              updatePreferences({ volume: Number(event.target.value) })
            }
          />
          <Glyph name="chevron" size={14} />
        </label>
      </div>
      <footer>
        <span>
          <Glyph name="battery" size={21} />
          100%
        </span>
        <button
          className="icon-button"
          aria-label="Open Settings"
          onClick={() => openApp("settings")}
        >
          <Glyph name="settings" size={18} />
        </button>
      </footer>
    </section>
  );
}
