import { useEffect, useRef, useState } from "react";
import { getResumeLocale } from "../../../data/resumeLocales";
import { Glyph } from "../../ui/Glyph";
import { ResumeDocument } from "./ResumeDocument";
import "./resume.css";

function readLanguage() {
  try { return localStorage.getItem("win11-resume-language") === "fa" ? "fa" : "en"; }
  catch { return "en"; }
}

export function Resume() {
  const [language, setLanguage] = useState(readLanguage);
  const scroll = useRef(null);
  const resume = getResumeLocale(language);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0, left: 0 });
    try { localStorage.setItem("win11-resume-language", language); }
    catch { /* Storage is optional. */ }
  }, [language]);
  return (
    <section className="resume-app" aria-label="Resume reader">
      <div className="resume-toolbar">
        <div className="resume-toolbar-actions">
          <div className="resume-language" role="group" aria-label="Resume language">
            <button lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
            <button lang="fa" dir="rtl" aria-pressed={language === "fa"} onClick={() => setLanguage("fa")}>فارسی</button>
          </div>
        <a className="resume-download" href={resume.pdf.url} download={resume.pdf.filename}>
          <Glyph name="download" size={17} /> <span lang={language}>{resume.labels.download}</span>
        </a>
        </div>
      </div>
      <div ref={scroll} className="resume-scroll" tabIndex={0} aria-label={resume.labels.document}>
        <ResumeDocument language={language} />
      </div>
    </section>
  );
}
