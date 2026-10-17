import { lazy, Suspense, useEffect } from "react";
import { Bookshelf } from "../apps/projects/Bookshelf";
import { findProject } from "../../data/projects";
import "./portfolio-view.css";

const Resume = lazy(() => import("../apps/resume/Resume").then((module) => ({ default: module.Resume })));
const Contact = lazy(() => import("../apps/contact/Contact").then((module) => ({ default: module.Contact })));

export function PortfolioView({ route, navigate }) {
  const missing = route.section === "missing" || (route.projectId && !findProject(route.projectId));
  useEffect(() => {
    const name = route.projectId ? findProject(route.projectId)?.name : route.section === "projects" ? "Projects" : route.section === "resume" ? "Resume" : "Contact";
    document.title = `${missing ? "Page not found" : name} | Mohammad Mahdavi`;
    return () => { document.title = "Mohammad Mahdavi | Portfolio"; };
  }, [route.section, route.projectId, missing]);
  function follow(event, href) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(href);
  }
  return (
    <div className={`portfolio-view ${route.section === "projects" ? "portfolio-projects" : ""}`}>
      <header className="portfolio-navigation">
        <a className="portfolio-owner" href="/projects" onClick={(event) => follow(event, "/projects")}>Mohammad Mahdavi</a>
        <nav aria-label="Portfolio">
          {[["projects", "Projects"], ["resume", "Resume"], ["contact", "Contact"]].map(([section, label]) => (
            <a key={section} href={`/${section}`} aria-current={route.section === section ? "page" : undefined} onClick={(event) => follow(event, `/${section}`)}>{label}</a>
          ))}
        </nav>
        <a className="portfolio-desktop" href="/" onClick={(event) => follow(event, "/")}>← Desktop</a>
      </header>
      <main className="portfolio-content">
        {missing ? <div className="portfolio-missing"><h1>Project not found</h1><a href="/projects" onClick={(event) => follow(event, "/projects")}>All projects</a></div> : (
          <Suspense fallback={<div className="empty-state">Loading…</div>}>
            {route.section === "projects" && <Bookshelf projectId={route.projectId} onProjectChange={(id) => navigate(id ? `/projects/${id}` : "/projects")} />}
            {route.section === "resume" && <Resume />}
            {route.section === "contact" && <Contact />}
          </Suspense>
        )}
      </main>
    </div>
  );
}
