import { useMemo } from "react";
import { TEACHER_EMAIL } from "../firebase";

export default function ContributorSidebar({ events }) {
  const contributors = useMemo(() => {
    const byName = {};
    events.forEach((e) => {
      if (!byName[e.addedBy]) {
        byName[e.addedBy] = { count: 0, email: e.addedByEmail };
      }
      byName[e.addedBy].count += 1;
    });
    return Object.entries(byName)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, email }]) => ({
        name,
        count,
        isTeacher: email === TEACHER_EMAIL,
      }));
  }, [events]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1.5px solid #EBEBEB",
        padding: "16px 18px",
      }}
    >
      <h3
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#9CA3AF",
          fontFamily: "'Overpass Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 12px 0",
        }}
      >
        Contributors
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {contributors.map((c) => (
          <div
            key={c.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 0",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: "'Overpass Mono', monospace",
                color: c.isTeacher ? "#6B7280" : "#1a1a1a",
                fontWeight: c.isTeacher ? 500 : 600,
                fontStyle: c.isTeacher ? "italic" : "normal",
              }}
            >
              {c.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: Math.min(c.count * 16, 80),
                  height: 6,
                  borderRadius: 3,
                  background: c.isTeacher ? "#E5E7EB" : "#1a1a1a",
                  transition: "width 0.3s ease",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Overpass Mono', monospace",
                  color: "#9CA3AF",
                  fontWeight: 600,
                  minWidth: 16,
                  textAlign: "right",
                }}
              >
                {c.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
