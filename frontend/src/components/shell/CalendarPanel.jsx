import { useState } from "react";
import { useClock } from "../../hooks/useClock";
import { Glyph } from "../ui/Glyph";

export function CalendarPanel({ widget = false }) {
  const now = useClock();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const firstDay = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <section
      className={`calendar-panel ${widget ? "calendar-widget" : "shell-panel"}`}
      aria-label="Calendar"
    >
      <div className="calendar-date">
        <span>
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <strong>
          {now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </strong>
      </div>
      <div className="calendar-heading">
        <button
          onClick={() => {
            setOffset(0);
            setSelected(null);
          }}
        >
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </button>
        <div>
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() => setOffset((value) => value - 1)}
          >
            <Glyph name="up" size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() => setOffset((value) => value + 1)}
          >
            <Glyph name="down" size={17} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            className={`${offset === 0 && day === now.getDate() ? "today" : ""} ${selected === day ? "selected-day" : ""}`}
            onClick={() => setSelected(day)}
          >
            {day}
          </button>
        ))}
      </div>
    </section>
  );
}
