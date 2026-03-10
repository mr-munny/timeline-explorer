import { useEffect, useRef, Suspense } from "react";
import EASTER_EGG_REGISTRY from "./registry";
import {
  recordEasterEggDiscovery,
  hasDiscoveredEasterEgg,
} from "../services/database";
import {
  useTheme,
  FONT_MONO,
  FONT_SIZES,
  SPACING,
  RADII,
} from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import arrowLeft from "@iconify-icons/mdi/arrow-left";

export default function EasterEggShell({
  eventId,
  eggId,
  event,
  onClose,
  user,
  section,
}) {
  const { theme } = useTheme();
  const entry = EASTER_EGG_REGISTRY[eggId];
  const discoveryRecorded = useRef(false);

  useEffect(() => {
    if (!user || !entry || discoveryRecorded.current) return;
    discoveryRecorded.current = true;
    (async () => {
      const already = await hasDiscoveredEasterEgg(eventId, user.uid);
      if (!already) {
        await recordEasterEggDiscovery(
          eventId,
          eggId,
          user.uid,
          user.displayName || user.email.split("@")[0],
          user.email,
          section
        );
      }
    })();
  }, [eventId, eggId, user, entry, section]);

  if (!entry) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: SPACING[10],
          fontFamily: FONT_MONO,
          color: theme.textSecondary,
          fontSize: FONT_SIZES.sm,
        }}
      >
        Easter egg not found.
      </div>
    );
  }

  const GameComponent = entry.component;

  return (
    <div style={{ padding: `${SPACING[5]} 0` }}>
      {/* Header: back button + context */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SPACING[3],
          marginBottom: SPACING[5],
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING["1.5"],
            padding: `${SPACING[2]} ${SPACING[4]}`,
            borderRadius: RADII.lg,
            border: `1.5px solid ${theme.accentGold}40`,
            background: `${theme.accentGold}12`,
            color: theme.accentGold,
            fontSize: FONT_SIZES.sm,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Icon icon={arrowLeft} width={14} />
          Back to Timeline
        </button>
        {event && (
          <span
            style={{
              fontSize: FONT_SIZES.sm,
              fontFamily: FONT_MONO,
              color: theme.textMuted,
            }}
          >
            {entry.label} &middot; {event.title}
          </span>
        )}
      </div>

      {/* Game component */}
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              fontFamily: FONT_MONO,
              color: theme.textSecondary,
              fontSize: FONT_SIZES.sm,
            }}
          >
            Loading...
          </div>
        }
      >
        <GameComponent event={event} eventId={eventId} onClose={onClose} />
      </Suspense>
    </div>
  );
}
