import { useState, useCallback, useEffect } from "react";

export default function useConnectionMode() {
  const [connectionMode, setConnectionMode] = useState(null);

  const handleConnectionModeClick = useCallback((eventId) => {
    if (!connectionMode) return;
    if (connectionMode.step === "selectCause") {
      setConnectionMode({ step: "selectEffect", causeEventId: eventId });
    } else if (connectionMode.step === "selectEffect") {
      if (eventId === connectionMode.causeEventId) return;
      setConnectionMode({ ...connectionMode, step: "describe", effectEventId: eventId });
    }
  }, [connectionMode]);

  // Escape key exits connection mode
  useEffect(() => {
    if (!connectionMode) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setConnectionMode(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [connectionMode]);

  return { connectionMode, setConnectionMode, handleConnectionModeClick };
}
