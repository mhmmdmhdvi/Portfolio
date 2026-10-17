import { useEffect, useRef } from "react";
import { BookCover } from "./BookCover";

const CAMERA_DURATION = 780;

export function BookFlight({ project, origin, target, onFinish }) {
  const element = useRef(null);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  useEffect(() => {
    let animation;
    const frame = requestAnimationFrame(() => {
      const spread = target.current?.querySelector(".book-spread");
      if (!spread || !element.current) { finish.current(); return; }
      const bounds = spread.getBoundingClientRect();
      const width = spread.classList.contains("is-spread") ? bounds.width / 2 : bounds.width;
      const x = bounds.right - width;
      animation = element.current.animate([
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
        { transform: `translate3d(${x - origin.x}px,${bounds.y - origin.y}px,0) scale(${width / origin.width},${bounds.height / origin.height})`, opacity: 1 },
      ], { duration: CAMERA_DURATION, easing: "cubic-bezier(.22,.68,.18,1)", fill: "forwards" });
      animation.finished.then(() => finish.current()).catch(() => {});
    });
    // Resizing cancels the flight instead of animating stale coordinates.
    const cancel = () => finish.current();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduceMotion = () => { if (media.matches) cancel(); };
    window.addEventListener("resize", cancel, { once: true });
    media.addEventListener("change", reduceMotion);
    return () => { cancelAnimationFrame(frame); animation?.cancel(); window.removeEventListener("resize", cancel); media.removeEventListener("change", reduceMotion); };
  }, [origin, target]);
  return (
    <div className="book-flight" aria-hidden="true" ref={element} style={{ left: origin.x, top: origin.y, width: origin.width, height: origin.height }}>
      <BookCover project={project} />
    </div>
  );
}
