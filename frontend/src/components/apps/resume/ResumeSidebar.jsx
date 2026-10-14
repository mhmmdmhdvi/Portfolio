export function ResumeSidebar({ skills, education, labels }) {
  return (
    <aside className="resume-sidebar" aria-label={labels.sidebar}>
      <section aria-labelledby="resume-skills-title">
        <h2 id="resume-skills-title">{labels.skills}</h2>
        {skills.map((group) => (
          <div className="resume-skill-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul>{group.items.map((skill) => <li key={skill}><bdi>{skill}</bdi></li>)}</ul>
          </div>
        ))}
      </section>
      <section className="resume-education" aria-labelledby="resume-education-title">
        <h2 id="resume-education-title">{labels.education}</h2>
        <h3>{education.degree}</h3>
        <p>{education.school}</p>
        <p className="resume-secondary">{education.location}</p>
        <p className="resume-period">{education.period}</p>
      </section>
    </aside>
  );
}
