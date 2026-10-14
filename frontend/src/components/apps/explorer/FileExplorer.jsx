import { useEffect, useState } from "react";
import { apps, folders } from "../../../data/apps";
import { useDesktop } from "../../../state/DesktopContext";
import { useFiles } from "../../../hooks/useFiles";
import { AppIcon } from "../../ui/AppIcon";
import { Glyph } from "../../ui/Glyph";
import { FolderProperties } from "./FolderProperties";

const names = {
  home: "Home",
  "this-pc": "This PC",
  "recycle-bin": "Recycle Bin",
  ...Object.fromEntries(folders.map((folder) => [folder.path, folder.name])),
};

export function FileExplorer({ initialPath = "home", openRequest }) {
  const { openApp } = useDesktop();
  const [history, setHistory] = useState([initialPath]);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState(false);
  const [more, setMore] = useState(false);
  const [properties, setProperties] = useState(false);
  const path = history[index];
  const { files, loading, error, refresh } = useFiles(path);
  const name = names[path] ?? path.split("/").at(-1);
  useEffect(() => {
    setHistory([initialPath]);
    setIndex(0);
    setQuery("");
    setSelected(null);
  }, [initialPath, openRequest]);

  function navigate(next) {
    if (next === path) return;
    const nextHistory = [...history.slice(0, index + 1), next];
    setHistory(nextHistory);
    setIndex(nextHistory.length - 1);
    setQuery("");
    setSelected(null);
  }
  function open(file) {
    if (file.kind === "folder") navigate(file.path);
    else if (file.kind === "app" && apps[file.appId]) openApp(file.appId);
    else {
      const relative = file.path.replace(/^documents\//, "");
      window.open(
        `/api/content/${relative.split("/").map(encodeURIComponent).join("/")}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }
  const displayed = files.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()),
  );
  if (sort) displayed.reverse();
  return (
    <div className="explorer">
      <div className="explorer-tab">
        <AppIcon
          name={path === "recycle-bin" ? "bin0" : "explorer"}
          size={16}
        />
        <span>{name}</span>
        <Glyph name="close" size={12} />
        <button
          className="icon-button"
          title="Home"
          aria-label="Go to Home"
          onClick={() => navigate("home")}
        >
          <Glyph name="plus" size={17} />
        </button>
      </div>
      <div className="explorer-commandbar">
        <button disabled>
          <Glyph name="plus" size={19} />
          New
          <Glyph name="down" size={12} />
        </button>
        <i />
        <button className="icon-button" aria-label="Cut" disabled>
          <Glyph name="cut" size={18} />
        </button>
        <button className="icon-button" aria-label="Copy" disabled>
          <Glyph name="copy" size={18} />
        </button>
        <button className="icon-button" aria-label="Paste" disabled>
          <Glyph name="document" size={18} />
        </button>
        <button className="icon-button" aria-label="Delete" disabled>
          <Glyph name="trash" size={18} />
        </button>
        <i />
        <button onClick={() => setSort((value) => !value)}>
          <Glyph name="sort" size={18} />
          Sort
          <Glyph name="down" size={12} />
        </button>
        <button
          onClick={() =>
            setView((value) => (value === "grid" ? "list" : "grid"))
          }
        >
          <Glyph name={view === "grid" ? "grid" : "list"} size={18} />
          View
          <Glyph name="down" size={12} />
        </button>
        <i />
        <button
          className="icon-button"
          aria-label="More"
          title="More"
          onClick={() => setMore((value) => !value)}
        >
          <Glyph name="more" size={19} />
        </button>
        {more && (
          <div className="explorer-more app-menu shell-panel">
            <button
              onClick={() => {
                refresh();
                setMore(false);
              }}
            >
              <Glyph name="refresh" size={16} />
              Refresh
            </button>
            <button
              onClick={() => {
                setProperties(true);
                setMore(false);
              }}
            >
              <Glyph name="info" size={16} />
              Properties
            </button>
          </div>
        )}
      </div>
      <div className="explorer-navigation">
        <div className="nav-arrows">
          <button
            className="icon-button"
            aria-label="Back"
            disabled={index === 0}
            onClick={() => setIndex((value) => value - 1)}
          >
            <Glyph name="back" size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Forward"
            disabled={index === history.length - 1}
            onClick={() => setIndex((value) => value + 1)}
          >
            <Glyph name="forward" size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Up"
            disabled={path === "home"}
            onClick={() =>
              navigate(
                path.includes("/")
                  ? path.split("/").slice(0, -1).join("/")
                  : "home",
              )
            }
          >
            <Glyph name="up" size={17} />
          </button>
        </div>
        <div className="address-bar">
          <AppIcon
            name={
              path === "this-pc"
                ? "pc"
                : path === "home"
                  ? "explorer"
                  : "folder"
            }
            size={19}
          />
          <Glyph name="chevron" size={12} />
          <span>{name}</span>
          <button
            className="icon-button"
            aria-label="Refresh folder"
            onClick={refresh}
          >
            <Glyph name="refresh" size={14} />
          </button>
        </div>
        <label className="explorer-search">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${name}`}
            aria-label={`Search ${name}`}
          />
          <Glyph name="search" size={16} />
        </label>
      </div>
      <div className="explorer-body">
        <nav className="explorer-sidebar" aria-label="Folders">
          <button
            className={path === "home" ? "selected" : ""}
            onClick={() => navigate("home")}
          >
            <Glyph name="home" size={18} />
            <span>Home</span>
          </button>
          <button
            className={path === "pictures" ? "selected" : ""}
            onClick={() => navigate("pictures")}
          >
            <Glyph name="image" size={18} />
            <span>Gallery</span>
          </button>
          <hr />
          {folders.map((folder) => (
            <button
              key={folder.path}
              className={path === folder.path ? "selected" : ""}
              onClick={() => navigate(folder.path)}
            >
              <Glyph name={folder.glyph} size={18} />
              <span>{folder.name}</span>
              <Glyph name="pin" size={11} />
            </button>
          ))}
          <hr />
          <button
            className={path === "this-pc" ? "selected" : ""}
            onClick={() => navigate("this-pc")}
          >
            <Glyph name="desktop" size={18} />
            <span>This PC</span>
          </button>
          <button
            className={path === "recycle-bin" ? "selected" : ""}
            onClick={() => navigate("recycle-bin")}
          >
            <AppIcon name="bin0" size={18} />
            <span>Recycle Bin</span>
          </button>
        </nav>
        <div
          className="explorer-files"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          {(path === "home" || path === "this-pc") && (
            <div className="file-section-heading">
              <Glyph name="down" size={14} />
              {files.every((file) => file.kind === "folder") ? "Folders" : "Items"} ({files.length})
            </div>
          )}
          {loading ? (
            <p className="empty-state">Working on it…</p>
          ) : error ? (
            <div className="empty-state">
              <p>{error}</p>
              <button className="small-button" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : !displayed.length ? (
            <p className="empty-state">
              {query ? "No items match your search." : "This folder is empty."}
            </p>
          ) : (
            <div className={`file-items file-view-${view}`}>
              {view === "list" && (
                <div className="file-list-header">
                  <span>Name</span>
                  <span>Date modified</span>
                  <span>Type</span>
                  <span>Size</span>
                </div>
              )}
              {displayed.map((file) => (
                <button
                  key={file.path}
                  aria-label={file.name}
                  className={`file-item ${selected === file.path ? "selected" : ""}`}
                  onClick={() => {
                    setSelected(file.path);
                    if (window.innerWidth <= 600 || window.matchMedia("(pointer: coarse)").matches) open(file);
                  }}
                  onDoubleClick={() => open(file)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      open(file);
                    }
                  }}
                >
                  <AppIcon
                    folder={file.kind === "folder"}
                    name={
                      file.kind === "folder"
                        ? (folders.find((folder) => folder.path === file.path)
                            ?.glyph ?? "folder")
                        : file.kind === "app"
                          ? (apps[file.appId]?.icon ?? "document")
                          : "document"
                    }
                    size={view === "grid" ? 48 : 20}
                  />
                  <span className="file-name" dir="auto">
                    {file.name}
                  </span>
                  {view === "list" && (
                    <>
                      <span>
                        {file.modified
                          ? new Date(file.modified).toLocaleDateString()
                          : ""}
                      </span>
                      <span>
                        {file.kind === "folder"
                          ? "File folder"
                          : file.kind === "app"
                            ? (apps[file.appId]?.fileType ?? "Shortcut")
                            : file.name.split(".").at(-1).toUpperCase() +
                              " File"}
                      </span>
                      <span>
                        {file.kind === "file"
                          ? Math.ceil(file.size / 1024) + " KB"
                          : ""}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <footer className="explorer-status">
        <span>
          {files.length} items{selected ? " · 1 item selected" : ""}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Details view"
            onClick={() => setView("list")}
          >
            <Glyph name="list" size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Large icons"
            onClick={() => setView("grid")}
          >
            <Glyph name="grid" size={16} />
          </button>
        </div>
      </footer>
      {properties && (
        <FolderProperties
          name={name}
          path={path}
          count={files.length}
          onClose={() => setProperties(false)}
        />
      )}
    </div>
  );
}
