import { getResumeLocale, resumePortrait } from "../../../data/resumeLocales";
import { ResumeProject } from "./ResumeProject";
import { ResumeSidebar } from "./ResumeSidebar";

export function ResumeDocument({ language = "en", portraitSrc = resumePortrait }) {
  const resume = getResumeLocale(language);
  const { labels } = resume;
  return (
    <article className="resume-document" lang={resume.language} dir={resume.direction} aria-label={labels.document}>
      <header className="resume-identity">
        <div className="resume-identity-text">
          <h1>{resume.name}</h1>
          <p>{resume.title}</p>
        </div>
        <img className="resume-portrait" src={portraitSrc} alt={labels.portrait} width="96" height="96" decoding="async" />
      </header>
      <ResumeSidebar skills={resume.skills} education={resume.education} labels={labels} />
      <div className="resume-main">
        <section className="resume-section" aria-labelledby="resume-profile-title">
          <h2 id="resume-profile-title">{labels.profile}</h2>
          <p>{resume.summary}</p>
        </section>
        <section className="resume-section" aria-labelledby="resume-experience-title">
          <h2 id="resume-experience-title">{labels.experience}</h2>
          {resume.experience.map((job) => (
            <article className="resume-job" key={job.company}>
              <div className="resume-job-heading">
                <h3>{job.role}</h3>
                <span className="resume-period">{job.period}</span>
              </div>
              <p className="resume-company"><bdi>{job.company}</bdi></p>
              <ul className="resume-bullets">
                {job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </article>
          ))}
        </section>
        <section className="resume-section" aria-labelledby="resume-projects-title">
          <h2 id="resume-projects-title">{labels.projects}</h2>
          {resume.projects.map((project) => <ResumeProject key={project.id} project={project} stackLabel={labels.stack} />)}
        </section>
      </div>
    </article>
  );
}
