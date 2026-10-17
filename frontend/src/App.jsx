import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BootScreen } from "./components/boot/BootScreen";
import { Desktop } from "./components/desktop/Desktop";
import { ShellPanels } from "./components/shell/ShellPanels";
import { Taskbar } from "./components/taskbar/Taskbar";
import { Glyph } from "./components/ui/Glyph";
import { WindowManager } from "./components/windows/WindowManager";
import { DesktopProvider, useDesktop } from "./state/DesktopContext";
import { useClock } from "./hooks/useClock";
import { usePageVisible } from "./hooks/usePageVisible";
import { getWallpaper } from "./data/wallpapers";
import { usePortfolioRoute } from "./components/portfolio/usePortfolioRoute";

const PortfolioView = lazy(() => import("./components/portfolio/PortfolioView").then((module) => ({ default: module.PortfolioView })));

function WindowsShell() {
  const { preferences, power, setPower, bootKey, restart } = useDesktop();
  const [booting, setBooting] = useState(true);
  const completeBoot = useCallback(() => setBooting(false), []);
  const now = useClock();
  const pageVisible = usePageVisible();
  const wallpaper = getWallpaper(preferences.wallpaper);
  useEffect(() => setBooting(true), [bootKey]);
  return (
    <div
      className="windows-shell"
      data-theme={preferences.theme}
      data-wallpaper={wallpaper.id}
      style={{
        "--wallpaper-image": `url(${wallpaper.src})`,
        "--wallpaper-portrait-image": `url(${wallpaper.portraitSrc ?? wallpaper.src})`,
      }}
    >
      <div className="desktop-session" inert={booting || power !== "on"}>
        <Desktop />
        <WindowManager enabled={!booting && power === "on" && pageVisible} />
        <ShellPanels />
        <Taskbar />
      </div>
      {(preferences.brightness < 100 || preferences.nightLight) && (
        <div
          className="desktop-tint"
          style={{
            background: preferences.nightLight
              ? `rgba(190, 100, 0, ${0.12 + (100 - preferences.brightness) / 150})`
              : `rgba(0, 0, 0, ${(100 - preferences.brightness) / 120})`,
          }}
        />
      )}
      {power === "sleep" && (
        <button
          className="power-screen lock-screen"
          aria-label="Wake desktop"
          style={{
            backgroundImage: `url(${wallpaper.src})`,
          }}
          onClick={() => setPower("on")}
        >
          <strong>
            {now.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </strong>
          <span>
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </button>
      )}
      {power === "off" && (
        <div className="power-screen">
          <button aria-label="Power on" title="Power on" onClick={restart}>
            <Glyph name="power" size={32} />
          </button>
        </div>
      )}
      {booting && <BootScreen key={bootKey} onComplete={completeBoot} />}
    </div>
  );
}

export function App() {
  const { route, navigate } = usePortfolioRoute();
  return (
    <DesktopProvider navigate={navigate}>
      {route.section === "desktop" ? <WindowsShell /> : (
        <Suspense fallback={<div className="empty-state">Loading…</div>}>
          <PortfolioView route={route} navigate={navigate} />
        </Suspense>
      )}
    </DesktopProvider>
  );
}
