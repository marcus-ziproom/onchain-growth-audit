"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChainRow = { name: string; tvl: number };

const CURATED = [
  "Ethereum", "Solana", "Tron", "BSC", "Base", "Arbitrum", "Avalanche", "Sui", "Polygon", "Optimism", "Bitcoin", "Aptos", "Sei", "Near", "Fantom",
] as const;

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (!values.length) return null;
  const w = 84;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        fill="none"
        stroke={up ? "#34d399" : "#f59e0b"}
        strokeWidth="2"
        points={pts}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChainStatsBoard() {
  const [baseRows, setBaseRows] = useState<ChainRow[]>([]);
  const [pulseRows, setPulseRows] = useState<ChainRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState("--:--:--");
  const seedRef = useRef<number[]>([]);
  const historyRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const res = await fetch("https://api.llama.fi/v2/chains", { cache: "no-store" });
        const json = await res.json();

        const map = new Map<string, number>();
        for (const c of json as Array<{ name: string; tvl: number }>) {
          if (!c?.name || typeof c?.tvl !== "number") continue;
          map.set(c.name, c.tvl);
        }

        const rows = CURATED
          .map((name) => ({ name, tvl: map.get(name) ?? 0 }))
          .filter((r) => r.tvl > 0)
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 10);

        if (!active) return;
        setBaseRows(rows);
        setPulseRows(rows);
        seedRef.current = rows.map((_, i) => (i + 1) * 97.1337 + Math.random() * 3);
        setUpdatedAt(new Date().toLocaleTimeString());
      } catch {
        // keep previous
      }
    }

    fetchData();
    const id = setInterval(fetchData, 20_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!baseRows.length) return;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      setPulseRows((prev) => {
        const next = baseRows.map((r, i) => {
          const seed = seedRef.current[i] ?? i;
          const wave = Math.sin((t + seed) * 0.22) * 0.0034;
          const wave2 = Math.cos((t + seed) * 0.11) * 0.0022;
          const noise = (Math.random() - 0.5) * 0.0018;
          const drift = clamp(wave + wave2 + noise, -0.007, 0.007);
          const baseline = prev.find((x) => x.name === r.name)?.tvl ?? r.tvl;
          const target = r.tvl * (1 + drift);
          const smooth = baseline + (target - baseline) * 0.55;

          const arr = historyRef.current[r.name] || [];
          const pushed = [...arr.slice(-23), smooth];
          historyRef.current[r.name] = pushed;

          return { name: r.name, tvl: smooth };
        });

        return [...next].sort((a, b) => b.tvl - a.tvl).slice(0, 10);
      });
    }, 550);

    return () => clearInterval(id);
  }, [baseRows]);

  const max = useMemo(() => Math.max(...pulseRows.map((r) => r.tvl), 1), [pulseRows]);

  const totals = useMemo(() => {
    if (!pulseRows.length) return { total: 0, avg: 0, dominance: 0 };
    const total = pulseRows.reduce((a, b) => a + b.tvl, 0);
    const avg = total / pulseRows.length;
    const dominance = (pulseRows[0]?.tvl || 0) / total;
    return { total, avg, dominance };
  }, [pulseRows]);

  const movers = useMemo(() => {
    const deltas = pulseRows.map((r) => {
      const base = baseRows.find((b) => b.name === r.name)?.tvl ?? r.tvl;
      const d = ((r.tvl - base) / base) * 100;
      return { name: r.name, d };
    });
    const top = [...deltas].sort((a, b) => b.d - a.d).slice(0, 3);
    const down = [...deltas].sort((a, b) => a.d - b.d).slice(0, 2);
    return [...top, ...down];
  }, [pulseRows, baseRows]);

  return (
    <section>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live chain command center</h2>
            <p className="sub" style={{ margin: 0 }}>
              Top 10 majors with live rank flips, moving numbers, and trend lines.
            </p>
          </div>
          <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>
            Pulse active • Source sync {updatedAt}
          </div>
        </div>

        <div style={{ marginTop: 10, border: "1px solid #2f4a84", borderRadius: 999, overflow: "hidden", background: "rgba(10,19,40,.6)" }}>
          <div style={{ whiteSpace: "nowrap", display: "inline-block", padding: "8px 0", animation: "marquee 16s linear infinite" }}>
            {movers.concat(movers).map((m, idx) => (
              <span key={`${m.name}-${idx}`} style={{ margin: "0 18px", color: m.d >= 0 ? "#92f8cc" : "#ffc47d", fontWeight: 700 }}>
                {m.name} {m.d >= 0 ? "▲" : "▼"} {Math.abs(m.d).toFixed(2)}%
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Top-10 TVL</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(34,211,238,.35)", fontVariantNumeric: "tabular-nums" }}>{fmtUsd(totals.total)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Avg per chain</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(139,92,246,.35)", fontVariantNumeric: "tabular-nums" }}>{fmtUsd(totals.avg)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Leader dominance</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(236,72,153,.35)", fontVariantNumeric: "tabular-nums" }}>{(totals.dominance * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {pulseRows.map((r, i) => {
            const w = Math.max(5, (r.tvl / max) * 100);
            const glow = i % 3 === 0 ? "rgba(34,211,238,.55)" : i % 3 === 1 ? "rgba(139,92,246,.55)" : "rgba(236,72,153,.55)";
            const base = baseRows.find((b) => b.name === r.name)?.tvl ?? r.tvl;
            const delta = ((r.tvl - base) / base) * 100;
            const hist = historyRef.current[r.name] || [r.tvl];
            return (
              <div key={r.name} style={{ position: "relative", border: "1px solid #2f4a84", borderRadius: 12, padding: "10px 12px", background: "rgba(10,19,40,.62)", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${10 + (i * 9) % 80}% 50%, ${glow}, transparent 55%)`, opacity: 0.16, pointerEvents: "none" }} />
                <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 10, alignItems: "center", position: "relative", zIndex: 2 }}>
                  <div style={{ color: "#9ec4ff", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <Sparkline values={hist} up={delta >= 0} />
                    </div>
                    <div style={{ height: 7, marginTop: 7, borderRadius: 999, background: "rgba(68,95,160,.35)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${w}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)",
                          boxShadow: "0 0 16px rgba(34,211,238,.55)",
                          transition: "width .45s cubic-bezier(.22,.61,.36,1)",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{fmtUsd(r.tvl)}</div>
                    <div style={{ fontSize: 12, color: delta >= 0 ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>
                      {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
