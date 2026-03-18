import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, PIE_COLORS } from "../constants/colors";
import { SentimentBar }        from "./SentimentBar";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      padding: "8px 14px", borderRadius: 8,
      fontFamily: "var(--font-mono)", fontSize: 12, color: COLORS.text,
    }}>
      {name}: <strong style={{ color: COLORS.accentLight }}>{value}%</strong>
    </div>
  );
}

function getDominant(sentiment) {
  const max   = Math.max(sentiment.positive, sentiment.negative, sentiment.neutral);
  const label = max === sentiment.positive ? "Positive" : max === sentiment.negative ? "Negative" : "Neutral";
  const color = label === "Positive" ? COLORS.positive : label === "Negative" ? COLORS.negative : COLORS.neutral;
  return { label, value: max, color };
}

export function SentimentChart({ sentiment }) {
  const pieData = [
    { name: "Positive", value: sentiment.positive },
    { name: "Negative", value: sentiment.negative },
    { name: "Neutral",  value: sentiment.neutral  },
  ];
  const dominant = getDominant(sentiment);

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16, padding: 28, marginBottom: 24,
      position: "relative", overflow: "hidden",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, ${COLORS.accent}60, transparent)`,
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: COLORS.accent }} />
        <span style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 11, color: COLORS.dim, letterSpacing: "0.14em" }}>
          SENTIMENT ANALYSIS
        </span>
      </div>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
        {/* Pie */}
        <div style={{ flex: "0 0 180px", height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                paddingAngle={3} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bars + dominant */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <SentimentBar label="POSITIVE" value={sentiment.positive} color={COLORS.positive} />
          <SentimentBar label="NEGATIVE" value={sentiment.negative} color={COLORS.negative} />
          <SentimentBar label="NEUTRAL"  value={sentiment.neutral}  color={COLORS.neutral}  />

          <div style={{
            marginTop: 18, padding: "12px 16px", borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: `linear-gradient(135deg, ${COLORS.bg2}, ${COLORS.card})`,
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.16em", marginBottom: 6 }}>
              DOMINANT SENTIMENT
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: dominant.color, lineHeight: 1 }}>
              {dominant.label} <span style={{ fontSize: 14, opacity: 0.7 }}>({dominant.value}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, flexWrap: "wrap" }}>
        {pieData.map(({ name, value }, i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: PIE_COLORS[i], boxShadow: `0 0 6px ${PIE_COLORS[i]}80` }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: COLORS.muted, letterSpacing: "0.1em" }}>
              {name.toUpperCase()} — {value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}