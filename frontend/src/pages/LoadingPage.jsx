import { COLORS }                 from "../constants/colors";
import { SOURCES, LOADING_STEPS } from "../constants/sources";
import { Spinner }                 from "../components/Spinner";
import { SourceChip }              from "../components/SourceChip";

export function LoadingPage({ query }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: "0 24px",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.accent}07 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <Spinner />

      <div style={{ width: "100%", maxWidth: 420, marginTop: 36 }}>
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: "1px", background: COLORS.border }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.22em" }}>
            SCANNING LIVE SOURCES
          </span>
          <div style={{ flex: 1, height: "1px", background: COLORS.border }} />
        </div>

        {/* Step list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {LOADING_STEPS.map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px", borderRadius: 10,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              animation: `fadeUp 0.5s ease ${i * 0.15}s both`,
            }}>
              <span style={{ fontSize: 14 }}>{step.icon}</span>
              <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 12, color: COLORS.dim, flex: 1, letterSpacing: "0.02em" }}>
                {step.label}
              </span>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                border: `1.5px solid ${COLORS.border}`,
                borderTopColor: COLORS.accent,
                animation: "spin 1s linear infinite",
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>

        {/* Source chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
          {SOURCES.map((s, i) => (
            <SourceChip key={s.name} {...s} delay={i * 160} />
          ))}
        </div>
      </div>

      {/* Query badge */}
      <div style={{
        marginTop: 44,
        padding: "10px 22px", borderRadius: 8,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.card,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.accent, animation: "pulse 1.5s infinite" }} />
        <p style={{ color: COLORS.muted, fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          Analysing: <span style={{ color: COLORS.accentLight }}>"{query}"</span>
        </p>
      </div>
    </div>
  );
}