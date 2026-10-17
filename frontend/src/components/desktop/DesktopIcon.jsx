import { AppIcon } from "../ui/AppIcon";

export function DesktopIcon({ item, size, selected, onSelect, onOpen }) {
  const className = `desktop-icon ${selected ? "selected" : ""}`;
  const content = <><AppIcon name={item.icon} size={size} /><span dir="auto">{item.name}</span></>;
  function select(event) {
    event.stopPropagation();
    onSelect(item.name);
  }

  if (item.href) {
    const external = item.href.startsWith("https://");
    return (
      <a className={className} aria-label={item.name} href={item.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} title={external ? `Open ${item.name} in a new tab` : undefined} onClick={select}>
        {content}
      </a>
    );
  }
  return (
    <button
      className={className}
      aria-label={item.name}
      onClick={(event) => {
        select(event);
        if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 600) onOpen(item);
      }}
      onDoubleClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      {content}
    </button>
  );
}
