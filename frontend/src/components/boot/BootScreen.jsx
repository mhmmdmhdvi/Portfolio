import { useEffect } from "react";
import { AppIcon } from "../ui/AppIcon";

export function BootScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="boot-screen" role="status" aria-label="Starting Windows">
      <AppIcon name="windows" size={92} />
      <span className="boot-spinner" aria-hidden="true" />
    </div>
  );
}
