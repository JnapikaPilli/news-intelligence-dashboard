import { useState, useEffect } from "react";
import { COLORS } from "../constants/colors";

export function SourceChip({ icon, name, delay }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 6,
        border: `1px solid ${hovered ? COLORS.accent + "40" : COLORS.border}`,
        background: hovered ? `${COLORS.accent}08` : COLORS.card,
        fontSize: 11, color: hovered ? COLORS.dim : COLORS.muted,
        fontFamily: "var(--font-ui)", fontWeight: 500,
        letterSpacing: "0.04em",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.2s, background 0.2s, color 0.2s",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span>{name}</span>
    </div>
  );
}