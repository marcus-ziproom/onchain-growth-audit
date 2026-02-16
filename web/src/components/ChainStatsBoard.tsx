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

export default function ChainStatsBoard() {
  const [baseRows, setBaseRows] = useState<ChainRow[]>([]);
  const [pulseRows, setPulseRows] = useState<ChainRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState("--:--:--");
  const seedRef = useRef<number[]>([]);

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
    const id = setInterval(fetchData, 20_000); // hard refresh from source
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // continuous movement between source refreshes
  useEffect(() => {
    if (!baseRows.length) return;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      setPulseRows((prev) =>
        baseRows.map((r, i) => {
          const seed = seedRef.current[i] ?? i;
          const wave = Math.sin((t + seed) * 0.22) * 0.0022; // 0.22%
          const wave2 = Math.cos((t + seed) * 0.11) * 0.0014;
          const noise = (Math.random() - 0.5) * 0.0012;
          const drift = clamp(wave + wave2 + noise, -0.004, 0.004);
          const baseline = prev[i]?.tvl ?? r.tvl;
          const target = r.tvl * (1 + drift);
          const smooth = baseline + (target - baseline) * 0.42;
          return { name: r.name, tvl: smooth };
        })
      );
    }, 650);

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

  return (
    <section>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live chain command center</h2>
            <p className="sub" style={{ margin: 0 }}>
              Top 10 majors with continuously moving live pulse visuals.
            </p>
          </div>
          <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>
            Pulse active • Source sync {updatedAt}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Top-10 TVL</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(34,211,238,.35)" }}>{fmtUsd(totals.total)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Avg per chain</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(139,92,246,.35)" }}>{fmtUsd(totals.avg)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Leader dominance</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(236,72,153,.35)" }}>{(totals.dominance * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {pulseRows.map((r, i) => {
            const w = Math.max(5, (r.tvl / max) * 100);
            const glow = i % 3 === 0 ? "rgba(34,211,238,.55)" : i % 3 === 1 ? "rgba(139,92,246,.55)" : "rgba(236,72,153,.55)";
            return (
              <div key={r.name} style={{ position: "relative", border: "1px solid #2f4a84", borderRadius: 12, padding: "10px 12px", background: "rgba(10,19,40,.62)", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${10 + (i * 9) % 80}% 50%, ${glow}, transparent 55%)`, opacity: 0.16, pointerEvents: "none" }} />
                <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 10, alignItems: "center", position: "relative", zIndex: 2 }}>
                  <div style={{ color: "#9ec4ff", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ height: 7, marginTop: 7, borderRadius: 999, background: "rgba(68,95,160,.35)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${w}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)",
                          boxShadow: "0 0 16px rgba(34,211,238,.55)",
                          transition: "width .55s cubic-bezier(.22,.61,.36,1)",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{fmtUsd(r.tvl)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
