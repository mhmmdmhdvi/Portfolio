import { AppIcon } from "../../ui/AppIcon";
import { Glyph } from "../../ui/Glyph";

export function FolderProperties({ name, path, count, onClose }) {
  return (
    <div className="properties-overlay">
      <section
        className="folder-properties"
        role="dialog"
        aria-label="Folder properties"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header>
          <span>{name} Properties</span>
          <button
            className="icon-button"
            aria-label="Close properties"
            onClick={onClose}
          >
            <Glyph name="close" size={16} />
          </button>
        </header>
        <div className="properties-body">
          <strong>General</strong>
          <div className="properties-name">
            <AppIcon name="folder" size={36} />
            <span>{name}</span>
          </div>
          <hr />
          <dl>
            <dt>Type:</dt>
            <dd>File folder</dd>
            <dt>Location:</dt>
            <dd>{path}</dd>
            <dt>Contains:</dt>
            <dd>{count} items</dd>
          </dl>
          <hr />
          <label>
            <span>Attributes:</span>
            <input type="checkbox" checked disabled readOnly />
            Read-only
          </label>
        </div>
        <footer>
          <button className="small-button" autoFocus onClick={onClose}>
            OK
          </button>
          <button className="small-button" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
}
