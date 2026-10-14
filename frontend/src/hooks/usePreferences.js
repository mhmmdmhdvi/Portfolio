import { useState } from "react";
import { wallpapers } from "../data/wallpapers";

const defaults = {
  theme: "light",
  wallpaper: "portfolio-blue",
  wallpaperVersion: 1,
  volume: 65,
  brightness: 100,
  iconSize: "medium",
  showIcons: true,
  wifi: true,
  bluetooth: false,
  nightLight: false,
};

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("win11-preferences") ?? "{}");
    return {
      ...defaults,
      ...Object.fromEntries(
        ["showIcons", "wifi", "bluetooth", "nightLight", "batterySaver"]
          .filter((key) => typeof saved[key] === "boolean")
          .map((key) => [key, saved[key]]),
      ),
      theme: saved.theme === "dark" ? "dark" : "light",
      wallpaper: saved.wallpaperVersion === defaults.wallpaperVersion &&
        wallpapers.some((wallpaper) => wallpaper.id === saved.wallpaper)
        ? saved.wallpaper
        : defaults.wallpaper,
      volume: Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(100, saved.volume))
        : defaults.volume,
      brightness: Number.isFinite(saved.brightness)
        ? Math.max(30, Math.min(100, saved.brightness))
        : defaults.brightness,
      iconSize: ["small", "medium", "large"].includes(saved.iconSize)
        ? saved.iconSize
        : "medium",
    };
  } catch {
    return defaults;
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  function updatePreferences(patch) {
    setPreferences((previous) => {
      const next = { ...previous, ...patch };
      try {
        localStorage.setItem("win11-preferences", JSON.stringify(next));
      } catch {
        /* Storage is optional. */
      }
      return next;
    });
  }
  return [preferences, updatePreferences];
}
