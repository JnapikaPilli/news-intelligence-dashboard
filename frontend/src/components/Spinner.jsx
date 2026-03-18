import { COLORS } from "../constants/colors";

export function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "48px 0" }}>
      {/* Multi-ring spinner */}
      <div style={{ position: "relative", width: 64, height: 64 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid ${COLORS.border}`,
          borderTopColor: COLORS.accent,
          animation: "spin 1.1s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          border: `1px solid ${COLORS.border}40`,
          borderBottomColor: `${COLORS.accent}60`,
          animation: "spin 1.8s linear infinite reverse",
        }} />
        <div style={{
          position: "absolute", inset: 18, borderRadius: "50%",
          border: `1px solid ${COLORS.accent}30`,
          borderLeftColor: COLORS.accentLight,
          animation: "spin 2.4s linear infinite",
        }} />
      </div>
      <p style={{
        color: COLORS.muted, fontSize: 10,
        letterSpacing: "0.26em", fontFamily: "var(--font-mono)",
        textTransform: "uppercase",
      }}>
        Gathering Intelligence
      </p>
    </div>
  );
}