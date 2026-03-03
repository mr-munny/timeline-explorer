import { useState } from "react";
import { Icon } from "@iconify/react";
import chartTimelineVariantShimmer from "@iconify-icons/mdi/chart-timeline-variant-shimmer";
import arrowLeft from "@iconify-icons/mdi/arrow-left";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { lookupTeacherByJoinCode, getSections } from "../services/database";

export default function SectionPicker({ sections, onSelect, userName }) {
  const { theme } = useTheme();
  const [step, setStep] = useState("code"); // "code" or "section"
  const [joinCode, setJoinCode] = useState("");
  const [codeError, setCodeError] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [teacher, setTeacher] = useState(null); // { uid, displayName, email, joinCode }
  const [teacherSections, setTeacherSections] = useState([]);
  const [selecting, setSelecting] = useState(false);

  const handleCodeSubmit = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLookingUp(true);
    setCodeError(null);
    try {
      const found = await lookupTeacherByJoinCode(code);
      if (!found) {
        setCodeError("No teacher found with that code. Check with your teacher and try again.");
        setLookingUp(false);
        return;
      }
      setTeacher(found);
      // Load this teacher's sections (one-time read)
      const allSections = await getSections();
      const filtered = allSections.filter((s) => s.teacherUid === found.uid);
      setTeacherSections(filtered);
      setStep("section");
    } catch (err) {
      console.error("Join code lookup failed:", err);
      setCodeError("Something went wrong. Please try again.");
    }
    setLookingUp(false);
  };

  const handleSelect = async (sectionId) => {
    setSelecting(true);
    try {
      await onSelect(sectionId, teacher.uid);
    } catch (err) {
      console.error("Section assignment failed:", err);
      setSelecting(false);
    }
  };

  const cardStyle = {
    background: theme.cardBg,
    borderRadius: RADII["2xl"],
    padding: `${SPACING[10]} ${SPACING[8]}`,
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
    boxShadow: theme.cardShadow,
    border: `1.5px solid ${theme.cardBorder}`,
  };

  return (
    <main
      style={{
        fontFamily: FONT_SERIF,
        background: theme.pageBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: theme.textPrimary,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=Overpass+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={cardStyle}>
        <div
          style={{
            fontSize: FONT_SIZES.tiny,
            fontWeight: 700,
            color: theme.accentGold,
            fontFamily: FONT_MONO,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: theme.accentGoldSubtle,
            padding: `${SPACING[1]} ${SPACING[2]}`,
            borderRadius: RADII.sm,
            display: "inline-block",
            marginBottom: SPACING[3],
          }}
        >
          Historian's Workshop
        </div>

        <h1
          style={{
            fontSize: FONT_SIZES.xxl,
            fontWeight: 700,
            margin: `0 0 ${SPACING["1.5"]} 0`,
            fontFamily: FONT_SERIF,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: SPACING[2],
          }}
        >
          <Icon icon={chartTimelineVariantShimmer} width={28} style={{ color: "#F59E0B" }} aria-hidden="true" />
          Timeline Explorer
        </h1>

        <p
          style={{
            fontSize: FONT_SIZES.sm,
            color: theme.textSecondary,
            margin: `0 0 ${SPACING["1.5"]} 0`,
            fontFamily: FONT_SERIF,
          }}
        >
          Welcome, {userName}!
        </p>

        {step === "code" ? (
          <>
            <p
              style={{
                fontSize: FONT_SIZES.base,
                color: theme.textMuted,
                margin: `0 0 ${SPACING[5]} 0`,
                fontFamily: FONT_MONO,
              }}
            >
              Enter your teacher's class code to get started
            </p>

            <div style={{ display: "flex", gap: SPACING[2], marginBottom: SPACING[3] }}>
              <input
                autoFocus
                id="join-code"
                aria-label="Teacher join code"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setCodeError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleCodeSubmit(); }}
                placeholder="e.g. MUNNY"
                maxLength={6}
                aria-invalid={codeError ? "true" : undefined}
                aria-describedby={codeError ? "code-error" : undefined}
                style={{
                  flex: 1,
                  padding: `${SPACING[3]} ${SPACING[3]}`,
                  border: `1.5px solid ${codeError ? theme.errorRed : theme.inputBorder}`,
                  borderRadius: RADII.lg,
                  fontSize: FONT_SIZES.md,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textAlign: "center",
                  background: theme.inputBg,
                  color: theme.textPrimary,
                  textTransform: "uppercase",
                }}
              />
              <button
                onClick={handleCodeSubmit}
                disabled={lookingUp || !joinCode.trim()}
                style={{
                  padding: `${SPACING[3]} ${SPACING[5]}`,
                  background: theme.activeToggleBg,
                  color: theme.activeToggleText,
                  border: "none",
                  borderRadius: RADII.lg,
                  fontSize: FONT_SIZES.sm,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  cursor: lookingUp || !joinCode.trim() ? "default" : "pointer",
                  opacity: lookingUp || !joinCode.trim() ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                {lookingUp ? "..." : "Join"}
              </button>
            </div>

            {codeError && (
              <p id="code-error" role="alert" style={{
                fontSize: FONT_SIZES.sm,
                color: theme.errorRed,
                margin: 0,
                fontFamily: FONT_MONO,
              }}>
                {codeError}
              </p>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep("code"); setTeacher(null); setTeacherSections([]); }}
              style={{
                background: "none",
                border: "none",
                color: theme.textSecondary,
                fontSize: FONT_SIZES.sm,
                fontFamily: FONT_MONO,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: SPACING[1],
                padding: `${SPACING[1]} 0`,
                marginBottom: SPACING[3],
              }}
            >
              <Icon icon={arrowLeft} width={14} aria-hidden="true" />
              Different teacher
            </button>

            <p
              style={{
                fontSize: FONT_SIZES.base,
                color: theme.textMuted,
                margin: `0 0 ${SPACING[5]} 0`,
                fontFamily: FONT_MONO,
              }}
            >
              Select your period in {teacher?.displayName || "your teacher"}'s class
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2] }}>
              {teacherSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  disabled={selecting}
                  style={{
                    padding: `${SPACING[3]} ${SPACING[5]}`,
                    background: theme.activeToggleBg,
                    color: theme.activeToggleText,
                    border: "none",
                    borderRadius: RADII.lg,
                    fontSize: FONT_SIZES.sm,
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    cursor: selecting ? "default" : "pointer",
                    letterSpacing: "0.02em",
                    transition: "all 0.15s",
                    opacity: selecting ? 0.6 : 1,
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {teacherSections.length === 0 && (
              <p
                style={{
                  fontSize: FONT_SIZES.base,
                  color: theme.textMuted,
                  margin: `${SPACING[4]} 0 0 0`,
                  fontFamily: FONT_MONO,
                }}
              >
                No sections available yet. Ask your teacher to set up class sections.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
