import { useState, useEffect } from "react";
import { COLORS } from "../constants/colors";

export function SentimentBar({ label, value, color }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 400);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ color: COLORS.muted, fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.18em" }}>
          {label}
        </span>
        <span style={{ color, fontSize: 13, fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600 }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 2, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2,
          transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: `0 0 8px ${color}44`,
        }} />
      </div>
    </div>
  );
}