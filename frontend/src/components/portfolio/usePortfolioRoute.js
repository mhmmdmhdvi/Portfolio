import { useEffect, useState } from "react";

function readRoute() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/") return { section: "desktop" };
  if (path === "/resume" || path === "/contact") return { section: path.slice(1) };
  if (path === "/projects") return { section: "projects", projectId: null };
  if (/^\/projects\/[a-z0-9-]+$/.test(path)) return { section: "projects", projectId: path.split("/")[2] };
  return { section: "missing" };
}

export function usePortfolioRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function navigate(path) {
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    setRoute(readRoute());
  }
  return { route, navigate };
}
