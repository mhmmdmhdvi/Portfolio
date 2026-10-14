export function ResumeProject({ project, stackLabel }) {
  return (
    <article className="resume-project">
      <h3><bdi>{project.name}</bdi></h3>
      <p>{project.description}</p>
      {project.bullets?.length > 0 && (
        <ul className="resume-bullets">
          {project.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      )}
      <p className="resume-stack"><span>{stackLabel}</span> <bdi dir="ltr">{project.stack.join(" · ")}</bdi></p>
    </article>
  );
}
