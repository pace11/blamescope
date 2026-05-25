"use client";

import React, { useEffect, useState } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────

export type BlameTheme = {
  background: string;
  backgroundSecondary: string;
  border: string;
  borderPinned: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  pinActive: string;
};

export const themes = {
  default: {
    background: "#0f0f1a",
    backgroundSecondary: "#1a1a2e",
    border: "#2a2a3e",
    borderPinned: "#f0b429",
    text: "#e0e0e0",
    textMuted: "#666",
    textFaint: "#444",
    accent: "#7ec8e3",
    pinActive: "#f0b429",
  },
  github: {
    background: "#1c2128",
    backgroundSecondary: "#2d333b",
    border: "#373e47",
    borderPinned: "#f78166",
    text: "#adbac7",
    textMuted: "#768390",
    textFaint: "#545d68",
    accent: "#539bf5",
    pinActive: "#f78166",
  },
  gitlab: {
    background: "#1f1e24",
    backgroundSecondary: "#2e2c36",
    border: "#3d3b47",
    borderPinned: "#fc6d26",
    text: "#e1e1e6",
    textMuted: "#8b8fa8",
    textFaint: "#525566",
    accent: "#fc6d26",
    pinActive: "#fc6d26",
  },
  bitbucket: {
    background: "#0c1929",
    backgroundSecondary: "#1b2638",
    border: "#2d4054",
    borderPinned: "#0065ff",
    text: "#b8c4cf",
    textMuted: "#6b778c",
    textFaint: "#42526e",
    accent: "#4c9aff",
    pinActive: "#0065ff",
  },
  aws: {
    background: "#0f1923",
    backgroundSecondary: "#1e2d3d",
    border: "#2d4157",
    borderPinned: "#ff9900",
    text: "#d5dbdb",
    textMuted: "#7f8c8d",
    textFaint: "#4d6070",
    accent: "#ff9900",
    pinActive: "#ff9900",
  },
  google: {
    background: "#202124",
    backgroundSecondary: "#303134",
    border: "#5f6368",
    borderPinned: "#8ab4f8",
    text: "#e8eaed",
    textMuted: "#9aa0a6",
    textFaint: "#5f6368",
    accent: "#8ab4f8",
    pinActive: "#8ab4f8",
  },
} satisfies Record<string, BlameTheme>;

export type ThemeName = keyof typeof themes;

type BlameInfo = {
  file: string;
  latestCommit: string;
  latestAuthor: string;
  latestDate: string;
  commitHash: string;
  commitUrl: string | null;
  latestEmail: string;
  totalCommits: number;
  contributors: { commits: number; author: string }[];
};

type ActiveTarget = {
  file: string;
  component: string;
  x: number;
  y: number;
};

const SERVER_URL = "http://localhost:4317";
const cache = new Map<string, BlameInfo>();

async function fetchBlame(file: string): Promise<BlameInfo | null> {
  if (cache.has(file)) return cache.get(file)!;
  try {
    const res = await fetch(
      `${SERVER_URL}/ownership?file=${encodeURIComponent(file)}`
    );
    if (!res.ok) return null;
    const data: BlameInfo = await res.json();
    cache.set(file, data);
    return data;
  } catch {
    return null;
  }
}

export function BlameOverlay({ theme: themeProp = "default" }: { theme?: ThemeName | BlameTheme } = {}) {
  const t: BlameTheme = typeof themeProp === "string" ? (themes[themeProp as ThemeName] ?? themes.default) : themeProp;
  const [active, setActive] = useState<ActiveTarget | null>(null);
  const [blame, setBlame] = useState<BlameInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinned, setPinned] = useState(false);
  const pinnedRef = React.useRef(false);

  // Alt key → pin overlay so text can be selected/copied
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        e.preventDefault();
        setPinned(true);
        pinnedRef.current = true;
      }
      if (e.key === "Escape") {
        setPinned(false);
        pinnedRef.current = false;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setPinned(false);
        pinnedRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (pinnedRef.current) return; // frozen while Alt held
      const el = (e.target as HTMLElement).closest("[data-blamescope]");

      if (!el) {
        setActive(null);
        return;
      }

      try {
        const parsed = JSON.parse(el.getAttribute("data-blamescope")!);
        setActive({
          file: parsed.file ?? "",
          component: parsed.component ?? "Unknown",
          x: e.clientX + 16,
          y: e.clientY + 16,
        });
      } catch {
        setActive(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (!active) {
      setBlame(null);
      setLoading(false);
      return;
    }

    if (cache.has(active.file)) {
      setBlame(cache.get(active.file)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setBlame(null);

    fetchBlame(active.file).then((data) => {
      if (cancelled) return;
      setBlame(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [active?.file]);

  return (
    <>
      {/* ── Banner ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          background: t.background,
          border: `1px solid ${t.border}`,
          borderBottom: "none",
          borderRadius: "8px 8px 0 0",
          padding: "3px 14px",
          zIndex: 999998,
          fontFamily: "monospace",
          fontSize: 11,
          color: t.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: t.accent,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span>blamescope active - hover a component</span>
      </div>

      {/* ── Tooltip ── */}
      {active && (
        <div
          style={{
            position: "fixed",
            top: active.y,
            left: active.x,
            background: t.background,
            color: t.text,
            padding: "12px 14px",
            borderRadius: 10,
            zIndex: 999999,
            fontSize: 12,
            pointerEvents: "auto",
            maxWidth: 320,
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
            fontFamily: "monospace",
            border: pinned ? `1px solid ${t.borderPinned}` : `1px solid ${t.border}`,
            lineHeight: 1.6,
            userSelect: pinned ? "text" : "none",
          }}
        >
          {/* Component name + file */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: t.accent, fontWeight: "bold", fontSize: 13 }}>
              ⬡ {active.component}
            </div>
            <div style={{ color: t.textMuted, fontSize: 11 }}>{active.file}</div>
          </div>

          {loading && (
            <div style={{ color: t.textMuted, fontSize: 11 }}>Loading blame…</div>
          )}

          {!loading && blame && (
            <>
              {/* Last commit */}
              <div
                style={{
                  borderTop: `1px solid ${t.border}`,
                  paddingTop: 8,
                  marginBottom: 8,
                }}
              >
                <div style={{ color: t.text, marginBottom: 2 }}>
                  "{blame.latestCommit}"
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: t.textMuted }}>
                    {blame.latestAuthor} · {blame.latestDate}
                  </div>
                  {blame.commitUrl ? (
                    <a
                      href={blame.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: t.accent,
                        background: t.backgroundSecondary,
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                        letterSpacing: "0.04em",
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      {blame.commitHash}
                    </a>
                  ) : (
                    <span
                      style={{
                        color: t.accent,
                        background: t.backgroundSecondary,
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {blame.commitHash}
                    </span>
                  )}
                </div>
                {blame.latestEmail && (
                  <div style={{ color: t.textFaint, fontSize: 11, marginTop: 2 }}>
                    {blame.latestEmail}
                  </div>
                )}
              </div>

              {/* Total commits */}
              <div
                style={{
                  borderTop: `1px solid ${t.border}`,
                  paddingTop: 6,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  color: t.textMuted,
                  fontSize: 11,
                }}
              >
                <span>Total commits</span>
                <span style={{ color: t.accent }}>{blame.totalCommits}</span>
              </div>

              {/* Contributors */}
              {blame.contributors.length > 0 && (
                <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                  <div style={{ color: t.textFaint, fontSize: 11, marginBottom: 4 }}>
                    CONTRIBUTORS
                  </div>
                  {blame.contributors.slice(0, 3).map((c) => (
                    <div
                      key={c.author}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        color: t.text,
                      }}
                    >
                      <span>{c.author}</span>
                      <span style={{ color: t.textMuted }}>{c.commits}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pin hint */}
          <div
            style={{
              borderTop: `1px solid ${t.border}`,
              marginTop: 8,
              paddingTop: 6,
              color: pinned ? t.pinActive : t.textFaint,
              fontSize: 10,
              textAlign: "center",
            }}
          >
            {pinned ? "📌 pinned — select to copy" : "hold ⌥ Alt to pin & copy"}
          </div>
        </div>
      )}
    </>
  );
}