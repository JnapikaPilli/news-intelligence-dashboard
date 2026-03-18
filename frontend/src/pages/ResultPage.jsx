import { COLORS }         from "../constants/colors";
import { SOURCES }        from "../constants/sources";
import { SourceChip }     from "../components/SourceChip";
import { SentimentChart } from "../components/SentimentChart";

export function ResultPage({ query, result, resetSearch }) {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "52px 24px 100px" }}>

      {/* ── Header ── */}
      <div style={{ animation: "fadeUp 0.6s ease both", marginBottom: 36 }}>
        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.positive, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.positive, letterSpacing: "0.16em" }}>LIVE</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${COLORS.positive}10`,
            border: `1px solid ${COLORS.positive}30`,
            borderRadius: 6, padding: "3px 10px",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: `${COLORS.positive}cc`, letterSpacing: "0.1em" }}>
              WEB SEARCH + NEWSAPI
            </span>
          </div>
          {result.fetchedAt && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, marginLeft: "auto", letterSpacing: "0.1em" }}>
              FETCHED {result.fetchedAt}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: "clamp(2rem, 6vw, 3.2rem)",
          fontFamily: "var(--font-display)", fontWeight: 300,
          fontStyle: "italic", letterSpacing: "-0.02em", lineHeight: 1.15,
          background: `linear-gradient(135deg, ${COLORS.text} 30%, ${COLORS.accentLight})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: 12,
        }}>
          {query}
        </h2>

        {/* Trend badge */}
        {result.trend && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 6,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.card,
          }}>
            <span>{result.trendEmoji}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: COLORS.dim, letterSpacing: "0.12em" }}>
              TREND: {result.trend.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* ── Summary card ── */}
      <div style={{
        animation: "fadeUp 0.6s ease 0.1s both",
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 28, marginBottom: 20,
        position: "relative", overflow: "hidden",
      }}>
        {/* Gold accent top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: `linear-gradient(90deg, ${COLORS.accent}80, transparent 60%)`,
        }} />
        {/* Subtle left rule */}
        <div style={{
          position: "absolute", top: 28, bottom: 28, left: 0, width: "2px",
          background: `linear-gradient(180deg, ${COLORS.accent}60, transparent)`,
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: COLORS.accent }} />
          <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 10, color: COLORS.dim, letterSpacing: "0.14em" }}>
            AI-DISTILLED SUMMARY
          </span>
          <span style={{
            marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9,
            color: COLORS.muted, background: COLORS.border,
            padding: "2px 8px", borderRadius: 4,
          }}>
            {result.summary?.length} chars
          </span>
        </div>

        <p style={{ lineHeight: 1.85, fontSize: 16.5, color: COLORS.text, fontFamily: "var(--font-display)", fontWeight: 300, paddingLeft: 13 }}>
          {result.summary}
        </p>
      </div>

      {/* ── Headlines ── */}
      {result.headlines?.length > 0 && (
        <div style={{ animation: "fadeUp 0.6s ease 0.2s both", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: COLORS.border }} />
            <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 10, color: COLORS.muted, letterSpacing: "0.14em" }}>
              RECENT HEADLINES
            </span>
            <div style={{ flex: 1, height: "1px", background: COLORS.border }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {result.headlines.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "13px 18px", background: COLORS.card,
                border: `1px solid ${COLORS.border}`, borderRadius: 10,
                animation: `fadeUp 0.4s ease ${0.25 + i * 0.07}s both`,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = `${COLORS.accent}30`}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.border}
              >
                <span style={{ color: COLORS.accent, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6, fontFamily: "var(--font-display)", fontWeight: 300 }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sources ── */}
      <div style={{ animation: "fadeUp 0.6s ease 0.3s both", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: COLORS.border }} />
          <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 10, color: COLORS.muted, letterSpacing: "0.14em" }}>
            SOURCES AGGREGATED
          </span>
          <div style={{ flex: 1, height: "1px", background: COLORS.border }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {SOURCES.map((s, i) => (
            <SourceChip key={s.name} {...s} delay={i * 55} />
          ))}
        </div>
      </div>

      {/* ── Sentiment Chart ── */}
      <div style={{ animation: "fadeUp 0.6s ease 0.4s both" }}>
        <SentimentChart sentiment={result.sentiment} />
      </div>

      {/* ── New search ── */}
      <div style={{ animation: "fadeUp 0.6s ease 0.5s both", textAlign: "center", marginTop: 8 }}>
        <button
          onClick={resetSearch}
          style={{
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.dim, borderRadius: 8, padding: "12px 36px",
            fontSize: 11, cursor: "pointer",
            fontFamily: "var(--font-ui)", fontWeight: 600,
            letterSpacing: "0.12em", textTransform: "uppercase",
            transition: "all 0.25s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = COLORS.accent + "60";
            e.currentTarget.style.color = COLORS.accentLight;
            e.currentTarget.style.background = `${COLORS.accent}08`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.color = COLORS.dim;
            e.currentTarget.style.background = "transparent";
          }}
        >
          ← New Search
        </button>
      </div>
    </div>
  );
}