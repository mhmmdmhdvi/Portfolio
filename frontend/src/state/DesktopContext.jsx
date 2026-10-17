import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { apps } from "../data/apps";
import { usePreferences } from "../hooks/usePreferences";
import { initialWindowState, windowReducer } from "./windows";

const DesktopContext = createContext(null);

export function DesktopProvider({ children, navigate }) {
  const [state, dispatch] = useReducer(windowReducer, initialWindowState);
  const [panel, setPanel] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [preferences, updatePreferences] = usePreferences();
  const [power, setPower] = useState("on");
  const [bootKey, setBootKey] = useState(0);

  function openApp(appId, payload) {
    if (appId === "projects") {
      navigate?.("/projects");
      setPanel(null);
      setContextMenu(null);
      return;
    }
    const app = apps[appId];
    if (!app) return;
    const width = Math.min(app.width, window.innerWidth - 24);
    const height = Math.min(app.height, window.innerHeight - 80);
    const offset = (state.windows.length % 5) * 24;
    dispatch({
      type: "open",
      appId,
      payload,
      bounds: {
        x: Math.max(
          0,
          Math.min(
            (window.innerWidth - width) / 2 + offset,
            window.innerWidth - width,
          ),
        ),
        y: Math.max(
          0,
          Math.min(
            (window.innerHeight - 48 - height) / 2 + offset,
            window.innerHeight - height - 48,
          ),
        ),
        width,
        height,
      },
    });
    setPanel(null);
    setContextMenu(null);
  }

  function togglePanel(name) {
    setPanel((previous) => (previous === name ? null : name));
    setContextMenu(null);
  }

  function restart() {
    setPower("on");
    setPanel(null);
    setBootKey((key) => key + 1);
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setPanel(null);
        setContextMenu(null);
      }
      if (event.altKey && event.key === "F4" && state.activeId) {
        event.preventDefault();
        dispatch({ type: "close", id: state.activeId });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.activeId]);

  return (
    <DesktopContext.Provider
      value={{
        ...state,
        dispatch,
        panel,
        setPanel,
        togglePanel,
        contextMenu,
        setContextMenu,
        preferences,
        updatePreferences,
        openApp,
        power,
        setPower,
        restart,
        bootKey,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
}

export function useDesktop() {
  return useContext(DesktopContext);
}
