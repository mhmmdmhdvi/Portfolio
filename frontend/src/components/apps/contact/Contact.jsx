import { useEffect, useRef, useState } from "react";
import { contactChannels, contactLocales } from "../../../data/contact";
import { Glyph } from "../../ui/Glyph";
import { ContactChannel } from "./ContactChannel";
import { useCopyContact } from "./useCopyContact";
import "./contact.css";

function readLanguage() {
  try { return localStorage.getItem("win11-contact-language") === "fa" ? "fa" : "en"; }
  catch { return "en"; }
}

export function Contact() {
  const [language, setLanguage] = useState(readLanguage);
  const locale = contactLocales[language];
  const scroll = useRef(null);
  const { copy, pending, result } = useCopyContact();
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0, left: 0 });
    try { localStorage.setItem("win11-contact-language", language); }
    catch { /* Storage is optional. */ }
  }, [language]);
  const notice = result
    ? result.status === "success" ? locale.channels[result.id].copied : locale.failed
    : "";
  return (
    <div className="contact-app" lang={language} dir={locale.direction}>
      <div className="contact-toolbar">
        <span><Glyph name="mail" size={17} />{locale.toolbar}</span>
        <div className="contact-language" role="group" aria-label="Contact language">
          <button lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
          <button lang="fa" dir="rtl" aria-pressed={language === "fa"} onClick={() => setLanguage("fa")}>فارسی</button>
        </div>
      </div>
      <div ref={scroll} className="contact-scroll">
        <section className="contact-sheet" lang={language} dir={locale.direction} aria-label={locale.information}>
          <header className="contact-header">
            <div>
              <h1>{locale.title}</h1>
              <p className="contact-name">{locale.name}</p>
              <p className="contact-role">{locale.role}</p>
            </div>
            <img className="contact-portrait" src="/assets/images/mohammad-mahdavi-portrait.jpg" alt={locale.portrait} width="88" height="88" decoding="async" />
          </header>
          <div className="contact-channels">
            {contactChannels.map((channel) => (
              <ContactChannel
                key={channel.id}
                channel={channel}
                locale={locale}
                copy={copy}
                pending={pending}
                copied={result?.id === channel.id && result.status === "success"}
              />
            ))}
          </div>
        </section>
      </div>
      <p className="contact-notice" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
    </div>
  );
}
