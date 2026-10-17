import { Glyph } from "./Glyph";

export function AppIcon({ name, size = 32, folder = false }) {
  if (folder && name !== "folder")
    return (
      <span className="folder-glyph">
        <AppIcon name="folder" size={size} />
        <Glyph name={name} size={Math.round(size / 3)} />
      </span>
    );
  if (name === "windows")
    return (
      <span
        className="windows-logo"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  if (
    ["solitaire", "snake", "twenty48", "breakout", "pinball", "chess", "pdf", "contact", "github", "projects"].includes(
      name,
    )
  )
    return (
      <img
        src={`/assets/icons/${name}.svg`}
        width={size}
        height={size}
        draggable="false"
        alt=""
      />
    );
  if (["folder", "pc", "document"].includes(name))
    return (
      <img
        src={`/assets/icons/${name}-native.png`}
        width={size}
        height={size}
        draggable="false"
        alt=""
      />
    );
  if (name === "mine")
    return (
      <span
        className="mine-icon"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        ✹
      </span>
    );
  if (
    ["document", "download", "image", "music", "video", "desktop"].includes(
      name,
    )
  )
    return (
      <span className="folder-glyph">
        <AppIcon name="folder" size={size} />
        <Glyph name={name} size={Math.round(size / 3)} />
      </span>
    );
  return (
    <img
      src={`/assets/icons/${name}.png`}
      width={size}
      height={size}
      draggable="false"
      alt=""
    />
  );
}
