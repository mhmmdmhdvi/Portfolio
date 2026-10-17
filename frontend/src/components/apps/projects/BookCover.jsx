export function BookCover({ project }) {
  return (
    <span className={`project-book-cover cover-${project.id}`} style={{ "--book-color": project.color, "--book-accent": project.accent }}>
      <span className="book-page-block" />
      <span className="book-front">
        <span className="book-spine" />
        <span className="book-title">{project.name}</span>
        <span className="book-cover-picture">
          {project.cover
            ? <img src={project.cover} alt="" loading="lazy" decoding="async" draggable="false" />
            : <span className="book-monogram" aria-hidden="true">M</span>}
        </span>
        <span className="book-cover-stack">{project.stack[0]}</span>
      </span>
    </span>
  );
}
