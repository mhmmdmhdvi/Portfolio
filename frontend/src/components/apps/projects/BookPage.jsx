export function BookPage({ project, index, onEnlarge, decorative = false }) {
  if (index > project.images.length) return <div className="reader-page blank-page" aria-hidden="true" />;
  const image = project.images[index - 1];
  return (
    <article className={`reader-page ${image ? "screenshot-page" : "intro-page"}`}>
      {image ? (
        <>
          <span className="paper-heading">{project.name}</span>
          {decorative ? (
            <span className="paper-image"><img src={image.preview} alt="" width={image.previewWidth} height={image.previewHeight} /></span>
          ) : (
            <button className="paper-image" aria-label={`Enlarge: ${image.caption}`} onClick={(event) => onEnlarge(index - 1, event.currentTarget)}>
              <img src={image.preview} alt={`${project.name} — ${image.caption}`} width={image.previewWidth} height={image.previewHeight} decoding="async" draggable="false" />
              <span className="image-enlarge-mark" aria-hidden="true">↗</span>
            </button>
          )}
          <p className="paper-caption">{image.caption}</p>
        </>
      ) : (
        <div className="book-introduction">
          <h2>{project.name}</h2>
          <p>{project.summary}</p>
          <ul className="book-stack" aria-label="Technology stack">
            {project.stack.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        </div>
      )}
      <span className="paper-number">{index + 1}</span>
    </article>
  );
}
