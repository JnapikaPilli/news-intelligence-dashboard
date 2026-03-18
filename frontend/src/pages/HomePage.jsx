import { useState, useEffect } from "react";
import { COLORS }       from "../constants/colors";
import { EXAMPLE_TAGS } from "../constants/sources";

// Floating ambient orb
function AmbientOrb({ style }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%",
      filter: "blur(80px)", pointerEvents: "none",
      animation: "breathe 6s ease-in-out infinite",
      ...style,
    }} />
  );
}

// Thin decorative rule with label
function Rule({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, transparent, ${COLORS.border})` }} />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted,
        letterSpacing: "0.22em", textTransform: "uppercase",
      }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${COLORS.border}, transparent)` }} />
    </div>
  );
}

// Ticker tape at bottom
const TICKER_ITEMS = [
  "BREAKING · AI adoption surges in enterprise sector",
  "MARKETS · Global indices show mixed performance",
  "TECH · New semiconductor restrictions announced",
  "WORLD · Climate summit enters second week",
  "SPORTS · IPL 2025 season kicks off in Mumbai",
  "ECONOMY · RBI holds repo rate steady at 6.5%",
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // doubled for seamless loop
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      borderTop: `1px solid ${COLORS.border}`,
      background: `linear-gradient(90deg, ${COLORS.bg}, #0b0e12ee)`,
      backdropFilter: "blur(12px)",
      height: 34, overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      {/* LIVE label */}
      <div style={{
        flexShrink: 0, padding: "0 16px",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 7, height: "100%",
        background: COLORS.bg,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.accent, animation: "pulse 1.5s infinite" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.accent, letterSpacing: "0.2em" }}>LIVE</span>
      </div>
      {/* Scrolling text */}
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{
          display: "flex", gap: 0,
          animation: "ticker 32s linear infinite",
          width: "max-content",
        }}>
          {items.map((item, i) => (
            <span key={i} style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: COLORS.dim, letterSpacing: "0.08em",
              padding: "0 32px", whiteSpace: "nowrap",
            }}>
              {item}
              <span style={{ color: COLORS.border, marginLeft: 32 }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage({ inputVal, setInputVal, inputRef, error, handleSearch, handleKeyDown }) {
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>

      {/* ── Ambient background ── */}
      <AmbientOrb style={{ width: 600, height: 600, top: "-15%", left: "50%", transform: "translateX(-50%)", background: `radial-gradient(circle, ${COLORS.accent}0a 0%, transparent 70%)` }} />
      <AmbientOrb style={{ width: 300, height: 300, bottom: "15%", right: "8%", background: `radial-gradient(circle, ${COLORS.positive}08 0%, transparent 70%)`, animationDelay: "2s" }} />
      <AmbientOrb style={{ width: 250, height: 250, top: "20%", left: "5%", background: `radial-gradient(circle, #4a90d908 0%, transparent 70%)`, animationDelay: "4s" }} />

      {/* ── Subtle grid ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(${COLORS.border}18 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.border}18 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* ── Corner decorations ── */}
      <div style={{ position: "fixed", top: 24, left: 24, zIndex: 10, opacity: mounted ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 20, height: "1px", background: COLORS.border }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.2em" }}>NL-2025</span>
        </div>
      </div>
      <div style={{ position: "fixed", top: 24, right: 24, zIndex: 10, opacity: mounted ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.2em" }}>INTELLIGENCE LAYER v2</span>
      </div>

      {/* ── Main content ── */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 620, padding: "0 24px", textAlign: "center" ,paddingBottom:"20px"}}>

        {/* Logo mark */}
        <div style={{
          marginBottom: 40,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
        }}>
          <div style={{
            width: 72, height: 72, margin: "0 auto 28px",
            borderRadius: 18,
            background: `linear-gradient(135deg, ${COLORS.bg2}, ${COLORS.card})`,
            border: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            animation: "glowPulse 4s ease-in-out infinite",
          }}>
            {/* Scan line effect */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: "2px",
              background: `linear-gradient(90deg, transparent, ${COLORS.accent}40, transparent)`,
              animation: "scanDown 3s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 30, position: "relative", zIndex: 1 }}>📡</span>
          </div>

          {/* Wordmark */}
          <h1 style={{
            fontSize: "clamp(1.2rem, 5vw, 3.5rem)",
            fontFamily: "var(--font-display)",
            fontWeight: 300,
            fontStyle: "italic",
            letterSpacing: "-0.03em",
            lineHeight: 0.85,
            background: `linear-gradient(160deg, ${COLORS.text} 20%, ${COLORS.accentLight} 60%, ${COLORS.accent} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Real Time News Intelligence Dashboard
          </h1>

          {/* Tagline with flanking lines */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }}>
            <div style={{ width: 40, height: "0.8px", background: `linear-gradient(90deg, transparent, ${COLORS.border})` }} />
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: COLORS.dim, letterSpacing: "0.28em", fontWeight: 500 }}>
              REAL-TIME &nbsp;·&nbsp; MULTI-SOURCE &nbsp;·&nbsp; AI-DISTILLED
            </p>
            <div style={{ width: 40, height: "1px", background: `linear-gradient(90deg, ${COLORS.border}, transparent)` }} />
          </div>
        </div>

        {/* ── Search field ── */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s",
          marginBottom: 28,
        }}>
          <div style={{
            position: "relative",
            borderRadius: 14,
            padding: "1px",
            background: focused
              ? `linear-gradient(135deg, ${COLORS.accent}55, ${COLORS.border}, ${COLORS.accent}22)`
              : `linear-gradient(135deg, ${COLORS.border}, ${COLORS.border}80)`,
            transition: "background 0.4s ease",
            boxShadow: focused ? `0 0 40px ${COLORS.accent}12, 0 20px 60px #00000060` : "0 8px 40px #00000050",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: COLORS.card,
              borderRadius: 13,
              padding: "6px 6px 6px 20px",
            }}>
              {/* Search icon */}
              <span style={{ fontSize: 15, opacity: focused ? 0.8 : 0.3, transition: "opacity 0.3s", marginRight: 12, flexShrink: 0 }}>⌕</span>

              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search any topic — AI, Cricket, Markets, Politics..."
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: COLORS.text, fontSize: 15, fontFamily: "var(--font-mono)",
                  letterSpacing: "0.02em", padding: "12px 0",
                }}
              />

              <button
                onClick={() => handleSearch()}
                style={{
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentLight})`,
                  border: "none", borderRadius: 9,
                  padding: "11px 22px",
                  color: "#0a0c0f", fontWeight: 700, fontSize: 11,
                  fontFamily: "var(--font-ui)", cursor: "pointer",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  transition: "opacity 0.2s, transform 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseOut={(e)  => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.transform = "scale(1)"; }}
              >
                Search
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: COLORS.negative, fontSize: 11, marginTop: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* ── Topic pills ── */}
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
        }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.2em", marginBottom: 14 }}>
            TRENDING TOPICS
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {EXAMPLE_TAGS.map((tag, i) => (
              <TopicPill key={tag} tag={tag} delay={i * 60} onSelect={() => { setInputVal(tag); handleSearch(tag); }} />
            ))}
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{
          marginTop: 56,
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.8s ease 0.7s",
          display: "flex", justifyContent: "center", gap: 0,
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "16px 0",
        }}>
          {[
            { val: "8+",    label: "Sources" },
            { val: "Live",  label: "Web Search" },
            { val: "AI",    label: "Summarised" },
            { val: "<30s",  label: "Results" },
          ].map(({ val, label }, i) => (
            <div key={label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 3 ? `1px solid ${COLORS.border}` : "none",
              padding: "0 8px",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: COLORS.accentLight, lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: COLORS.muted, letterSpacing: "0.14em", marginTop: 5 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ticker ── */}
      <Ticker />
    </div>
  );
}

function TopicPill({ tag, delay, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay + 600);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${COLORS.accent}12` : "transparent",
        border: `1px solid ${hovered ? COLORS.accent + "60" : COLORS.border}`,
        color: hovered ? COLORS.accentLight : COLORS.dim,
        borderRadius: 6, padding: "6px 14px",
        fontSize: 11, cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        letterSpacing: "0.06em",
        transition: "all 0.25s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {tag}
    </button>
  );
}