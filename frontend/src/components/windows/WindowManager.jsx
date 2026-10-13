import { lazy, Suspense } from "react";
import { useDesktop } from "../../state/DesktopContext";
import { WindowFrame } from "./WindowFrame";
const load = (loader, name) =>
  lazy(() => loader().then((module) => ({ default: module[name] })));
const FileExplorer = load(
  () => import("../apps/explorer/FileExplorer"),
  "FileExplorer",
);
const Calculator = load(
  () => import("../apps/calculator/Calculator"),
  "Calculator",
);
const Solitaire = load(
  () => import("../apps/solitaire/Solitaire"),
  "Solitaire",
);
const Snake = load(() => import("../apps/snake/Snake"), "Snake");
const Twenty48 = load(() => import("../apps/twenty48/Twenty48"), "Twenty48");
const Breakout = load(() => import("../apps/breakout/Breakout"), "Breakout");
const Pinball = load(() => import("../apps/pinball/Pinball"), "Pinball");
const Chess = load(() => import("../apps/chess/Chess"), "Chess");
const Minesweeper = load(
  () => import("../apps/minesweeper/Minesweeper"),
  "Minesweeper",
);
const Notepad = load(() => import("../apps/notepad/Notepad"), "Notepad");
const Paint = load(() => import("../apps/paint/Paint"), "Paint");
const Photos = load(() => import("../apps/photos/Photos"), "Photos");
const Settings = load(() => import("../apps/settings/Settings"), "Settings");
const Store = load(() => import("../apps/store/Store"), "Store");
const TaskManager = load(
  () => import("../apps/taskmanager/TaskManager"),
  "TaskManager",
);
const Terminal = load(() => import("../apps/terminal/Terminal"), "Terminal");

const components = {
  calculator: Calculator,
  solitaire: Solitaire,
  snake: Snake,
  twenty48: Twenty48,
  breakout: Breakout,
  pinball: Pinball,
  chess: Chess,
  minesweeper: Minesweeper,
  notepad: Notepad,
  paint: Paint,
  photos: Photos,
  settings: Settings,
  store: Store,
  taskmanager: TaskManager,
  terminal: Terminal,
};

export function WindowManager({ enabled = true }) {
  const { windows, activeId, panel, contextMenu } = useDesktop();
  return [...windows]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => {
      const Component = components[item.appId];
      return (
        <WindowFrame key={item.id} window={item} stackOrder={10 + index}>
          <Suspense fallback={<div className="empty-state">Loading…</div>}>
            {item.appId === "explorer" || item.appId === "recycle-bin" ? (
              <FileExplorer
                openRequest={item.payload}
                initialPath={
                  item.appId === "recycle-bin"
                    ? "recycle-bin"
                    : (item.payload?.path ?? "home")
                }
              />
            ) : (
              <Component
                active={
                  enabled &&
                  activeId === item.id &&
                  !item.minimized &&
                  !panel &&
                  !contextMenu
                }
                section={item.payload?.section}
              />
            )}
          </Suspense>
        </WindowFrame>
      );
    });
}
