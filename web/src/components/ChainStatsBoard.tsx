"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChainRow = {
  name: string;
  tvl: number;
};

const CURATED = [
  "Ethereum",
  "Solana",
  "Tron",
  "BSC",
  "Base",
  "Arbitrum",
  "Avalanche",
  "Sui",
  "Polygon",
  "Optimism",
  "Bitcoin",
  "Aptos",
  "Sei",
  "Near",
  "Fantom",
] as const;

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ChainStatsBoard() {
  const [targetRows, setTargetRows] = useState<ChainRow[]>([]);
  const [displayRows, setDisplayRows] = useState<ChainRow[]>([]);
  const prevRef = useRef<ChainRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("--:--:--");

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const res = await fetch("https://api.llama.fi/v2/chains", { cache: "no-store" });
        const json = await res.json();
        const byName = new Map<string, number>();

        for (const c of json as Array<{ name: string; tvl: number }>) {
          if (!c?.name || typeof c?.tvl !== "number") continue;
          byName.set(c.name, c.tvl);
        }

        const curatedRows = CURATED
          .map((name) => ({ name, tvl: byName.get(name) ?? 0 }))
          .filter((r) => r.tvl > 0)
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 10);

        if (!active) return;
        const now = new Date();
        setUpdatedAt(now.toLocaleTimeString());
        setTargetRows(curatedRows);
      } catch {
        // keep previous values
      }
    }

    fetchData();
    const id = setInterval(fetchData, 45_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!targetRows.length) return;

    const from = prevRef.current.length ? prevRef.current : targetRows;
    const t0 = performance.now();
    const duration = 950;
    let raf = 0;

    const fromMap = new Map(from.map((r) => [r.name, r.tvl]));

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);

      const next = targetRows.map((r) => {
        const start = fromMap.get(r.name) ?? r.tvl;
        return { name: r.name, tvl: start + (r.tvl - start) * eased };
      });

      setDisplayRows(next);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = targetRows;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetRows]);

  const max = useMemo(() => Math.max(...displayRows.map((r) => r.tvl), 1), [displayRows]);

  return (
    <section>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live chain pulse</h2>
            <p className="sub" style={{ margin: 0 }}>
              Top 10 major chains by TVL (live feed) with animated updates.
            </p>
          </div>
          <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>
            Updated {updatedAt} • Source: DeFiLlama
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {displayRows.map((r, i) => {
            const w = Math.max(5, (r.tvl / max) * 100);
            return (
              <div key={r.name} style={{ position: "relative", border: "1px solid #2f4a84", borderRadius: 12, padding: "10px 12px", background: "rgba(10,19,40,.6)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 10, alignItems: "center" }}>
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
                          boxShadow: "0 0 14px rgba(34,211,238,.42)",
                          transition: "width .8s cubic-bezier(.22,.61,.36,1)",
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#9df1d0" }}>{fmtUsd(r.tvl)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
