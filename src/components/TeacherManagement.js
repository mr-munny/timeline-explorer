import { useState, useEffect } from "react";
import { useTheme, FONT_MONO, FONT_SERIF, FONT_SIZES, SPACING, RADII } from "../contexts/ThemeContext";
import { Icon } from "@iconify/react";
import accountPlus from "@iconify-icons/mdi/account-plus";
import contentCopy from "@iconify-icons/mdi/content-copy";
import eyeOutline from "@iconify-icons/mdi/eye-outline";
import accountRemove from "@iconify-icons/mdi/account-remove";
import checkIcon from "@iconify-icons/mdi/check";
import {
  subscribeToAllTeachers,
  subscribeToTeacherInvites,
  createTeacherInvite,
  removeTeacherRecord,
  removeTeacherInvite,
  updateTeacherJoinCode,
  generateJoinCode,
  subscribeToSections,
} from "../services/database";

export default function TeacherManagement({ user, teacherData, onImpersonate }) {
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [confirmDemote, setConfirmDemote] = useState(null);
  const [editingJoinCode, setEditingJoinCode] = useState(null);
  const [newJoinCode, setNewJoinCode] = useState("");

  useEffect(() => {
    const unsub1 = subscribeToAllTeachers(setTeachers);
    const unsub2 = subscribeToTeacherInvites(setInvites);
    const unsub3 = subscribeToSections((data) => setAllSections(data || []));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const sectionCountByTeacher = {};
  for (const s of allSections) {
    if (s.teacherUid) {
      sectionCountByTeacher[s.teacherUid] = (sectionCountByTeacher[s.teacherUid] || 0) + 1;
    }
  }

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setInviteError("Enter a valid email address.");
      return;
    }
    // Check if already a teacher
    if (teachers.some((t) => t.email.toLowerCase() === email)) {
      setInviteError("This person is already a teacher.");
      return;
    }
    // Check if already invited
    if (invites.some((i) => i.email === email)) {
      setInviteError("This email is already pending.");
      return;
    }
    try {
      await createTeacherInvite(email, user.uid);
      setInviteEmail("");
      setInviteError(null);
      setInviteSuccess(`${email} added — awaiting their first login`);
      setTimeout(() => setInviteSuccess(null), 3000);
    } catch (err) {
      console.error("Invite failed:", err);
      setInviteError("Failed to add teacher. Try again.");
    }
  };

  const handleDemote = async (uid) => {
    try {
      await removeTeacherRecord(uid);
      setConfirmDemote(null);
    } catch (err) {
      console.error("Demote failed:", err);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveJoinCode = async (uid) => {
    const code = newJoinCode.trim().toUpperCase();
    if (!code) return;
    await updateTeacherJoinCode(uid, code);
    setEditingJoinCode(null);
    setNewJoinCode("");
  };

  const handleRegenerateCode = async (uid) => {
    const code = generateJoinCode();
    await updateTeacherJoinCode(uid, code);
  };

  const labelStyle = {
    fontSize: FONT_SIZES.micro,
    fontWeight: 700,
    color: theme.textMuted,
    fontFamily: FONT_MONO,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: SPACING[3],
  };

  const cardStyle = {
    background: theme.cardBg,
    border: `1.5px solid ${theme.cardBorder}`,
    borderRadius: RADII.xl,
    padding: `${SPACING[4]} ${SPACING[5]}`,
    marginBottom: SPACING[4],
  };

  return (
    <div style={{ padding: `${SPACING[6]} ${SPACING[8]}`, maxWidth: 640 }}>
      <h2 style={{
        fontSize: FONT_SIZES.lg,
        fontWeight: 700,
        margin: `0 0 ${SPACING[1]} 0`,
        fontFamily: FONT_SERIF,
        color: theme.textPrimary,
      }}>
        Teacher Management
      </h2>
      <p style={{
        fontSize: FONT_SIZES.micro,
        color: theme.textMuted,
        fontFamily: FONT_MONO,
        margin: `0 0 ${SPACING[6]} 0`,
      }}>
        Manage teacher accounts and join codes
      </p>

      {/* Your Join Code */}
      <div style={cardStyle}>
        <div style={labelStyle}>Your Join Code</div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING[3] }}>
          <span style={{
            fontSize: FONT_SIZES.xxl,
            fontWeight: 700,
            fontFamily: FONT_MONO,
            letterSpacing: "0.15em",
            color: theme.textPrimary,
          }}>
            {teacherData?.joinCode || "\u2014"}
          </span>
          <button
            onClick={() => handleCopyCode(teacherData?.joinCode)}
            aria-label="Copy join code"
            style={{
              background: "none",
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: RADII.sm,
              padding: `${SPACING[1]} ${SPACING[2]}`,
              cursor: "pointer",
              color: copiedCode === teacherData?.joinCode ? theme.teacherGreen : theme.textSecondary,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              display: "inline-flex",
              alignItems: "center",
              gap: SPACING[1],
              transition: "all 0.15s",
            }}
          >
            <Icon icon={copiedCode === teacherData?.joinCode ? checkIcon : contentCopy} width={12} />
            {copiedCode === teacherData?.joinCode ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => handleRegenerateCode(user.uid)}
            aria-label="Regenerate join code"
            style={{
              background: "none",
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: RADII.sm,
              padding: `${SPACING[1]} ${SPACING[2]}`,
              cursor: "pointer",
              color: theme.textSecondary,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              transition: "all 0.15s",
            }}
          >
            Regenerate
          </button>
        </div>
        <p style={{
          fontSize: FONT_SIZES.tiny,
          color: theme.textMuted,
          fontFamily: FONT_MONO,
          margin: `${SPACING[2]} 0 0 0`,
        }}>
          Share this code with students so they can join your class.
        </p>
      </div>

      {/* Add Teacher Account */}
      <div style={cardStyle}>
        <div style={labelStyle}>
          <Icon icon={accountPlus} width={12} style={{ verticalAlign: "middle", marginRight: SPACING[1] }} />
          Add Teacher Account
        </div>
        <div style={{ display: "flex", gap: SPACING[2] }}>
          <label htmlFor="invite-teacher-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Teacher email address</label>
          <input
            id="invite-teacher-email"
            value={inviteEmail}
            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
            placeholder="teacher@school.edu"
            style={{
              flex: 1,
              padding: `${SPACING[2]} ${SPACING[3]}`,
              border: `1.5px solid ${inviteError ? theme.errorRed : theme.inputBorder}`,
              borderRadius: RADII.md,
              fontSize: FONT_SIZES.tiny,
              fontFamily: FONT_MONO,
              background: theme.inputBg,
              color: theme.textPrimary,
            }}
          />
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            style={{
              padding: `${SPACING[2]} ${SPACING[4]}`,
              background: theme.teacherGreen,
              color: "#fff",
              border: "none",
              borderRadius: RADII.md,
              fontSize: FONT_SIZES.micro,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              cursor: inviteEmail.trim() ? "pointer" : "default",
              opacity: inviteEmail.trim() ? 1 : 0.5,
            }}
          >
            Add
          </button>
        </div>
        {inviteError && (
          <p aria-live="polite" style={{ fontSize: FONT_SIZES.micro, color: theme.errorRed, fontFamily: FONT_MONO, margin: `${SPACING["1.5"]} 0 0` }}>
            {inviteError}
          </p>
        )}
        {inviteSuccess && (
          <p aria-live="polite" style={{ fontSize: FONT_SIZES.micro, color: theme.teacherGreen, fontFamily: FONT_MONO, margin: `${SPACING["1.5"]} 0 0` }}>
            {inviteSuccess}
          </p>
        )}
      </div>

      {/* Awaiting Login */}
      {invites.length > 0 && (
        <div style={cardStyle}>
          <div style={labelStyle}>Awaiting Login</div>
          {invites.map((inv) => (
            <div key={inv.key} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `${SPACING["1.5"]} 0`,
              borderBottom: `1px solid ${theme.cardBorder}`,
            }}>
              <span style={{
                fontSize: FONT_SIZES.tiny,
                fontFamily: FONT_MONO,
                color: theme.textPrimary,
              }}>
                {inv.email}
              </span>
              <button
                onClick={() => removeTeacherInvite(inv.email)}
                aria-label={`Remove invite for ${inv.email}`}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.textMuted,
                  fontSize: FONT_SIZES.tiny,
                  fontFamily: FONT_MONO,
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Teacher List */}
      <div style={cardStyle}>
        <div style={labelStyle}>All Teachers</div>
        {teachers.map((t) => {
          const isYou = t.uid === user.uid;
          return (
            <div key={t.uid} style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
              padding: `${SPACING["2.5"]} 0`,
              borderBottom: `1px solid ${theme.cardBorder}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: FONT_SIZES.sm,
                  fontWeight: 600,
                  fontFamily: FONT_MONO,
                  color: theme.textPrimary,
                }}>
                  {t.displayName || t.email.split("@")[0]}
                  {isYou && <span style={{ color: theme.textMuted, fontWeight: 400 }}> (you)</span>}
                  {t.isSuperAdmin && (
                    <span style={{
                      fontSize: FONT_SIZES.micro,
                      background: "#7C3AED20",
                      color: "#7C3AED",
                      padding: `1px ${SPACING["1.5"]}`,
                      borderRadius: RADII.sm,
                      marginLeft: SPACING[2],
                      fontWeight: 700,
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: FONT_SIZES.tiny,
                  color: theme.textMuted,
                  fontFamily: FONT_MONO,
                }}>
                  {t.email}
                  {" \u00B7 "}
                  Code: {editingJoinCode === t.uid ? (
                    <span style={{ display: "inline-flex", gap: SPACING[1], alignItems: "center" }}>
                      <label htmlFor={`join-code-${t.uid}`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Join code</label>
                      <input
                        id={`join-code-${t.uid}`}
                        autoFocus
                        value={newJoinCode}
                        onChange={(e) => setNewJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveJoinCode(t.uid);
                          if (e.key === "Escape") { setEditingJoinCode(null); setNewJoinCode(""); }
                        }}
                        maxLength={6}
                        style={{
                          width: 60,
                          padding: `1px ${SPACING[1]}`,
                          border: `1px solid ${theme.inputBorder}`,
                          borderRadius: RADII.sm,
                          fontSize: FONT_SIZES.tiny,
                          fontFamily: FONT_MONO,
                          background: theme.inputBg,
                          color: theme.textPrimary,
                          textTransform: "uppercase",
                        }}
                      />
                      <button onClick={() => handleSaveJoinCode(t.uid)} aria-label="Save join code" style={{ background: "none", border: "none", color: theme.teacherGreen, cursor: "pointer", padding: 0 }}>
                        <Icon icon={checkIcon} width={12} />
                      </button>
                    </span>
                  ) : (
                    <span
                      onClick={() => { setEditingJoinCode(t.uid); setNewJoinCode(t.joinCode || ""); }}
                      style={{ cursor: "pointer", borderBottom: `1px dashed ${theme.textMuted}` }}
                    >
                      {t.joinCode || "\u2014"}
                    </span>
                  )}
                  {" \u00B7 "}
                  {sectionCountByTeacher[t.uid] || 0} sections
                </div>
              </div>

              <div style={{ display: "flex", gap: SPACING[1] }}>
                {!isYou && (
                  <button
                    onClick={() => onImpersonate({ uid: t.uid, displayName: t.displayName, email: t.email })}
                    title="View as this teacher"
                    aria-label={`View as ${t.displayName || t.email}`}
                    style={{
                      background: "none",
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: RADII.sm,
                      padding: `${SPACING[1]} ${SPACING["1.5"]}`,
                      cursor: "pointer",
                      color: theme.textSecondary,
                      display: "inline-flex",
                      alignItems: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon icon={eyeOutline} width={14} />
                  </button>
                )}
                {!isYou && !t.isSuperAdmin && (
                  confirmDemote === t.uid ? (
                    <div style={{ display: "flex", gap: SPACING[1], alignItems: "center" }}>
                      <button
                        onClick={() => handleDemote(t.uid)}
                        style={{
                          background: theme.errorRed,
                          color: "#fff",
                          border: "none",
                          borderRadius: RADII.sm,
                          padding: `${SPACING[1]} ${SPACING[2]}`,
                          fontSize: FONT_SIZES.tiny,
                          fontFamily: FONT_MONO,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDemote(null)}
                        style={{
                          background: "none",
                          border: `1px solid ${theme.inputBorder}`,
                          borderRadius: RADII.sm,
                          padding: `${SPACING[1]} ${SPACING[2]}`,
                          fontSize: FONT_SIZES.tiny,
                          fontFamily: FONT_MONO,
                          cursor: "pointer",
                          color: theme.textSecondary,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDemote(t.uid)}
                      title="Remove teacher access"
                      aria-label={`Remove teacher access for ${t.displayName || t.email}`}
                      style={{
                        background: "none",
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: RADII.sm,
                        padding: `${SPACING[1]} ${SPACING["1.5"]}`,
                        cursor: "pointer",
                        color: theme.textSecondary,
                        display: "inline-flex",
                        alignItems: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon icon={accountRemove} width={14} />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
