import "./desktop-welcome.css";

export function DesktopWelcome() {
  return (
    <section className="desktop-welcome" aria-label="Portfolio introduction" lang="en">
      <h1>Mohammad <span>Mahdavi</span></h1>
      <p className="desktop-welcome-title">Full Stack Developer</p>
      <div className="desktop-welcome-greeting">
        <p>Welcome to my portfolio.</p>
        <p>Have fun exploring.</p>
      </div>
    </section>
  );
}
