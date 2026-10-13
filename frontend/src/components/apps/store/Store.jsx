import { apps } from "../../../data/apps";
import { useDesktop } from "../../../state/DesktopContext";
import { AppIcon } from "../../ui/AppIcon";

export function Store() {
  const { openApp } = useDesktop();
  return (
    <div className="store">
      <h1>Library</h1>
      <div className="store-apps">
        {Object.entries(apps)
          .filter(([id]) => !["store", "recycle-bin"].includes(id))
          .map(([id, app]) => (
            <div key={id}>
              <AppIcon name={app.icon} size={44} />
              <span>
                <strong>{app.title}</strong>
                <small>App</small>
              </span>
              <button className="small-button" onClick={() => openApp(id)}>
                Open
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
