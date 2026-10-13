import { useEffect, useRef, useState } from "react";
import { apps, folders, pinnedApps } from "../../data/apps";
import { useDesktop } from "../../state/DesktopContext";
import { AppIcon } from "../ui/AppIcon";
import { Glyph } from "../ui/Glyph";

export function StartMenu({ searchMode = false }) {
  const { openApp, setPower, restart } = useDesktop();
  const [query, setQuery] = useState("");
  const [allApps, setAllApps] = useState(false);
  const [powerMenu, setPowerMenu] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    if (searchMode) input.current?.focus();
  }, [searchMode]);
  const filtered = Object.entries(apps)
    .filter(([, app]) => app.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a[1].title.localeCompare(b[1].title));
  return (
    <section
      className="start-menu shell-panel"
      aria-label={searchMode ? "Search" : "Start menu"}
    >
      <div className="start-search">
        <Glyph name="search" size={18} />
        <input
          ref={input}
          type="search"
          aria-label="Search apps, settings, and documents"
          placeholder="Search for apps, settings, and documents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query || allApps ? (
        <div className="start-results">
          <div className="start-section-title">
            <strong>{query ? "Best match" : "All apps"}</strong>
            <button
              className="small-button"
              onClick={() => {
                setQuery("");
                setAllApps(false);
              }}
            >
              <Glyph name="back" size={14} /> Back
            </button>
          </div>
          <div className="app-result-list">
            {filtered.map(([id, app]) => (
              <button
                key={id}
                aria-label={app.title}
                className="app-result"
                onClick={() => openApp(id)}
              >
                <AppIcon name={app.icon} size={32} />
                <span>
                  {app.title}
                  <small>App</small>
                </span>
                <Glyph name="chevron" size={16} />
              </button>
            ))}
            {!filtered.length && (
              <p className="empty-state">No results found.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="start-section-title">
            <strong>Pinned</strong>
            <button className="small-button" onClick={() => setAllApps(true)}>
              All apps <Glyph name="chevron" size={12} />
            </button>
          </div>
          <div className="pinned-grid">
            {pinnedApps.map((id) => (
              <button
                key={id}
                aria-label={apps[id].title}
                onClick={() => openApp(id)}
              >
                <AppIcon name={apps[id].icon} size={32} />
                <span>{apps[id].title}</span>
              </button>
            ))}
            {folders.map((folder) => (
              <button
                key={folder.path}
                aria-label={folder.name}
                onClick={() => openApp("explorer", { path: folder.path })}
              >
                <AppIcon name={folder.glyph} size={32} folder />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
          <div className="start-section-title recommended-title">
            <strong>Recommended</strong>
            <button
              className="small-button"
              onClick={() => openApp("explorer", { path: "documents" })}
            >
              More <Glyph name="chevron" size={12} />
            </button>
          </div>
          <div className="recommended-empty">No recent items.</div>
        </>
      )}
      <footer className="start-footer">
        <button
          className="start-user"
          onClick={() => openApp("settings", { section: "system" })}
        >
          <span className="user-avatar">
            <Glyph name="user" size={19} />
          </span>
          <span>User</span>
        </button>
        <div className="power-container">
          <button
            className="icon-button"
            aria-label="Power"
            title="Power"
            onClick={() => setPowerMenu((value) => !value)}
          >
            <Glyph name="power" size={19} />
          </button>
          {powerMenu && (
            <div className="power-menu shell-panel">
              <button onClick={() => setPower("sleep")}>
                <Glyph name="moon" size={16} />
                Sleep
              </button>
              <button onClick={() => setPower("off")}>
                <Glyph name="power" size={16} />
                Shut down
              </button>
              <button onClick={restart}>
                <Glyph name="refresh" size={16} />
                Restart
              </button>
            </div>
          )}
        </div>
      </footer>
    </section>
  );
}
