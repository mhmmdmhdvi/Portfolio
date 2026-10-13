import { useState } from "react";
import { apps } from "../../../data/apps";
import { useDesktop } from "../../../state/DesktopContext";
import { AppIcon } from "../../ui/AppIcon";

export function TaskManager() {
  const { windows, dispatch } = useDesktop();
  const [selected, setSelected] = useState(null);
  return (
    <div className="task-manager">
      <header>
        <h1>Processes</h1>
        <button
          className="small-button"
          disabled={!selected || selected === "taskmanager"}
          onClick={() => {
            dispatch({ type: "close", id: selected });
            setSelected(null);
          }}
        >
          End task
        </button>
      </header>
      <div className="process-heading">
        <span>Name</span>
        <span>Status</span>
      </div>
      {windows.map((item) => (
        <button
          key={item.id}
          className={`process-row ${selected === item.id ? "selected" : ""}`}
          onClick={() => setSelected(item.id)}
        >
          <AppIcon name={apps[item.appId].icon} size={20} />
          <span>{apps[item.appId].title}</span>
          <span>{item.minimized ? "Minimized" : "Running"}</span>
        </button>
      ))}
    </div>
  );
}
