import { useEffect, useRef, useState } from "react";
import { findProject, projects } from "../../../data/projects";
import { BookCover } from "./BookCover";
import { BookFlight } from "./BookFlight";
import { BookReader } from "./BookReader";
import "./bookshelf.css";

export function Bookshelf({ active = true, projectId, onProjectChange }) {
  const selected = projectId ?? null;
  const [flight, setFlight] = useState(null);
  const covers = useRef(new Map());
  const readerLayer = useRef(null);
  const previous = useRef(null);
  useEffect(() => {
    setFlight((current) => current?.id === selected ? current : null);
  }, [selected]);
  useEffect(() => {
    if (!selected && previous.current) covers.current.get(previous.current)?.focus({ preventScroll: true });
    previous.current = selected;
  }, [selected]);
  function select(id) {
    const cover = covers.current.get(id);
    if (cover && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const { x, y, width, height } = cover.getBoundingClientRect();
      setFlight({ id, x, y, width, height });
    } else setFlight(null);
    onProjectChange?.(id);
  }
  const project = findProject(selected);
  return (
    <section className={`projects-app ${project ? "has-open-book" : ""}`} aria-label="Project library">
      <div className="library-scene" inert={!!project} aria-hidden={project ? true : undefined}>
        <header className="library-header"><h1>Project Library</h1></header>
        <div className="library-scroll">
          <div className="library-shelves">
            {projects.map((item) => (
              <div className="shelf-slot" key={item.id}>
                <button className="project-book" aria-label={`Open book: ${item.name}`} ref={(element) => { if (element) covers.current.set(item.id, element); else covers.current.delete(item.id); }} onClick={() => select(item.id)}>
                  <BookCover project={item} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {project && <div className="library-reader-layer" ref={readerLayer}>
        <BookReader key={project.id} project={project} onClose={() => select(null)} active={active} arriving={!!flight} />
      </div>}
      {project && flight && <BookFlight key={flight.id} project={project} origin={flight} target={readerLayer} onFinish={() => setFlight(null)} />}
    </section>
  );
}
