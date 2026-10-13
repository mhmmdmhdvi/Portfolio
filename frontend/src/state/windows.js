export const initialWindowState = { windows: [], activeId: null, sequence: 0 };

function topVisible(windows) {
  return (
    windows
      .filter((window) => !window.minimized)
      .sort((a, b) => b.order - a.order)[0]?.id ?? null
  );
}

export function windowReducer(state, action) {
  const sequence = state.sequence + 1;
  const existing = state.windows.find(
    (window) => window.id === (action.id ?? action.appId),
  );
  if (action.type === "open") {
    const windows = existing
      ? state.windows.map((window) =>
          window.id === existing.id
            ? {
                ...window,
                minimized: false,
                order: sequence,
                payload: action.payload ?? window.payload,
              }
            : window,
        )
      : [
          ...state.windows,
          {
            id: action.appId,
            appId: action.appId,
            bounds: action.bounds,
            minimized: false,
            maximized: false,
            order: sequence,
            payload: action.payload,
          },
        ];
    return { windows, activeId: action.appId, sequence };
  }
  if (!existing) return state;
  let windows = state.windows;
  switch (action.type) {
    case "close":
      windows = windows.filter((window) => window.id !== action.id);
      break;
    case "focus":
      windows = windows.map((window) =>
        window.id === action.id
          ? { ...window, minimized: false, order: sequence }
          : window,
      );
      return { windows, activeId: action.id, sequence };
    case "minimize":
      windows = windows.map((window) =>
        window.id === action.id ? { ...window, minimized: true } : window,
      );
      break;
    case "maximize":
      windows = windows.map((window) =>
        window.id === action.id
          ? {
              ...window,
              maximized: !window.maximized,
              minimized: false,
              order: sequence,
            }
          : window,
      );
      return { windows, activeId: action.id, sequence };
    case "bounds":
      windows = windows.map((window) =>
        window.id === action.id
          ? { ...window, bounds: action.bounds, maximized: false }
          : window,
      );
      break;
    default:
      return state;
  }
  return { windows, activeId: topVisible(windows), sequence };
}
