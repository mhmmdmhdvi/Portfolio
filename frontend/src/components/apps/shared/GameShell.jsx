import "./games.css";

export function GameShell({ title, status, toolbar, children, footer }) {
  return (
    <section className="game-shell" aria-label={title}>
      <header className="game-toolbar">
        <div className="game-actions">{toolbar}</div>
        <span className="game-status" role="status" aria-live="polite">
          {status}
        </span>
      </header>
      <div className="game-content">{children}</div>
      {footer && <footer className="game-footer">{footer}</footer>}
    </section>
  );
}
