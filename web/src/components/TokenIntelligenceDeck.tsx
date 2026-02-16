"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  rank: number;
  chain: string;
  id?: string;
  price?: number;
  marketCap?: number;
  circ?: number;
  max?: number;
  change24h?: number;
  tvl: number;
  stakedPct: number;
  lstPct: number;
};

const CHAIN_TO_COINGECKO: Record<string, string> = {
  Ethereum: "ethereum",
  Solana: "solana",
  Tron: "tron",
  BSC: "binancecoin",
  "BNB Chain": "binancecoin",
  Base: "ethereum",
  Arbitrum: "arbitrum",
  Optimism: "optimism",
  Avalanche: "avalanche-2",
  Polygon: "matic-network",
  Sui: "sui",
  Bitcoin: "bitcoin",
  Aptos: "aptos",
  Near: "near",
  Fantom: "fantom",
  Sei: "sei-network",
  Hyperliquid: "hyperliquid",
};

const BLACKLIST = new Set(["All", "Others", "Stable", "Unknown"]);

const usd = (n?: number) => {
  if (n === undefined || !isFinite(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const num = (n?: number) => {
  if (n === undefined || !isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return `${n.toFixed(2)}`;
};

function RingGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
        <circle cx="45" cy="45" r={r} stroke="rgba(120,140,200,.25)" strokeWidth="8" fill="none" />
        <circle
          cx="45"
          cy="45"
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 45 45)"
          style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,.35))" }}
        />
        <text x="45" y="49" textAnchor="middle" fill="#d6ffe7" fontSize="12" fontWeight="800">{pct.toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
    </div>
  );
}

function modelRatios(chain: string) {
  // Placeholder modeled ratios for visual comparison when live staking/LST per-chain APIs are unavailable.
  const map: Record<string, { staked: number; lst: number }> = {
    Ethereum: { staked: 28, lst: 39 },
    Solana: { staked: 64, lst: 10 },
    Tron: { staked: 47, lst: 3 },
    BSC: { staked: 21, lst: 4 },
    Base: { staked: 8, lst: 2 },
    Arbitrum: { staked: 7, lst: 1 },
    Optimism: { staked: 9, lst: 1 },
    Avalanche: { staked: 58, lst: 8 },
    Polygon: { staked: 36, lst: 5 },
    Sui: { staked: 74, lst: 2 },
    Bitcoin: { staked: 0, lst: 0 },
    Fogo: { staked: 0, lst: 0 },
  };
  return map[chain] ?? { staked: 12, lst: 2 };
}

export default function TokenIntelligenceDeck() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState("--:--:--");
  const [mode, setMode] = useState<"investor" | "ops">("investor");

  useEffect(() => {
    let alive = true;

    const pull = async () => {
      try {
        const chainRes = await fetch("https://api.llama.fi/v2/chains", { cache: "no-store" });
        const chains = (await chainRes.json()) as Array<{ name: string; tvl: number }>;

        const top10 = chains
          .filter((c) => c?.name && typeof c.tvl === "number" && !BLACKLIST.has(c.name) && c.name !== "Fogo")
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 10);

        const tvlMap = new Map(chains.map((c) => [c.name, c.tvl]));
        const fogoTvl = tvlMap.get("Fogo") ?? 0;

        const ids = Array.from(
          new Set(
            top10
              .map((c) => CHAIN_TO_COINGECKO[c.name])
              .filter(Boolean)
          )
        ) as string[];

        let marketMap = new Map<string, any>();
        if (ids.length) {
          const mRes = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=24h`,
            { cache: "no-store" }
          );
          const markets = (await mRes.json()) as any[];
          marketMap = new Map(markets.map((m) => [m.id, m]));
        }

        const builtTop10: Row[] = top10.map((c, i) => {
          const id = CHAIN_TO_COINGECKO[c.name];
          const m = id ? marketMap.get(id) : undefined;
          const ratios = modelRatios(c.name);
          return {
            rank: i + 1,
            chain: c.name,
            id,
            price: m?.current_price,
            marketCap: m?.market_cap,
            circ: m?.circulating_supply,
            max: m?.max_supply ?? m?.total_supply,
            change24h: m?.price_change_percentage_24h,
            tvl: c.tvl,
            stakedPct: ratios.staked,
            lstPct: ratios.lst,
          };
        });

        const fogoRatios = modelRatios("Fogo");
        const fogoRow: Row = {
          rank: 11,
          chain: "Fogo",
          id: "fogo",
          tvl: fogoTvl,
          stakedPct: fogoRatios.staked,
          lstPct: fogoRatios.lst,
        };

        const built = [...builtTop10, fogoRow];

        if (!alive) return;
        setRows((prev) => {
          if (!prev.length) return built;
          return built.map((n) => {
            const p = prev.find((x) => x.chain === n.chain);
            if (!p) return n;
            const lerp = (a?: number, b?: number, k = 0.45) => {
              if (a === undefined) return b;
              if (b === undefined) return a;
              return a + (b - a) * k;
            };
            return {
              ...n,
              price: lerp(p.price, n.price),
              marketCap: lerp(p.marketCap, n.marketCap),
              tvl: (p.tvl ?? n.tvl) + (n.tvl - (p.tvl ?? n.tvl)) * 0.45,
              circ: lerp(p.circ, n.circ),
              change24h: lerp(p.change24h, n.change24h, 0.55),
            };
          });
        });
        setUpdated(new Date().toLocaleTimeString());
      } catch {
        // keep prior
      }
    };

    pull();
    const id = setInterval(pull, 18000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const top = useMemo(() => rows.slice(0, 3), [rows]);

  const command = useMemo(() => {
    if (!rows.length) return { totalTvl: 0, avgTvl: 0, dominance: 0, movers: [] as { name: string; d: number }[] };
    const top10 = rows.slice(0, 10);
    const totalTvl = top10.reduce((a, b) => a + b.tvl, 0);
    const avgTvl = totalTvl / Math.max(top10.length, 1);
    const dominance = (top10[0]?.tvl || 0) / Math.max(totalTvl, 1);
    const movers = [...top10]
      .map((r) => ({ name: r.chain, d: r.change24h ?? 0 }))
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 5);
    return { totalTvl, avgTvl, dominance, movers };
  }, [rows]);

  return (
    <section>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live token intelligence deck</h2>
            <p className="sub" style={{ margin: 0 }}>Top 10 chains rotate from live TVL ranking. Fogo is always anchored at #11.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setMode("investor")} className="btn btn-sec" style={{ padding: "7px 10px", background: mode === "investor" ? "rgba(34,211,238,.16)" : undefined }}>Investor View</button>
            <button onClick={() => setMode("ops")} className="btn btn-sec" style={{ padding: "7px 10px", background: mode === "ops" ? "rgba(139,92,246,.16)" : undefined }}>Founder Ops</button>
            <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>Live sync {updated}</div>
          </div>
        </div>

        <div style={{ marginTop: 10, border: "1px solid #2f4a84", borderRadius: 999, overflow: "hidden", background: "rgba(10,19,40,.6)" }}>
          <div style={{ whiteSpace: "nowrap", display: "inline-block", padding: "8px 0", animation: "marquee 16s linear infinite" }}>
            {command.movers.concat(command.movers).map((m, idx) => (
              <span key={`${m.name}-${idx}`} style={{ margin: "0 18px", color: m.d >= 0 ? "#92f8cc" : "#ffc47d", fontWeight: 700 }}>
                {m.name} {m.d >= 0 ? "▲" : "▼"} {Math.abs(m.d).toFixed(2)}%
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Top-10 TVL</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(34,211,238,.35)", fontVariantNumeric: "tabular-nums" }}>{usd(command.totalTvl)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Avg TVL / chain</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(139,92,246,.35)", fontVariantNumeric: "tabular-nums" }}>{usd(command.avgTvl)}</div>
          </div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}>
            <div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Leader dominance</div>
            <div style={{ fontWeight: 900, fontSize: 26, color: "#9df1d0", textShadow: "0 0 14px rgba(236,72,153,.35)", fontVariantNumeric: "tabular-nums" }}>{(command.dominance * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          {top.map((r) => (
            <div key={r.chain} style={{ border: "1px solid #2f4a84", borderRadius: 14, padding: 12, background: "rgba(10,19,40,.62)", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <b>#{r.rank} {r.chain}</b>
                  <span style={{ color: (r.change24h ?? 0) >= 0 ? "#92f8cc" : "#ffc47d", fontWeight: 700 }}>{(r.change24h ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(r.change24h ?? 0).toFixed(2)}%</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 25, fontWeight: 900, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{usd(r.price)}</div>
                <div style={{ color: "#9fb3de", fontSize: 12 }}>{mode === "investor" ? `MCap ${usd(r.marketCap)}` : `TVL ${usd(r.tvl)}`}</div>
              </div>
              <RingGauge value={r.max ? ((r.circ ?? 0) / r.max) * 100 : 0} label="Circ" color="#22d3ee" />
              <RingGauge value={mode === "investor" ? r.stakedPct : r.lstPct} label={mode === "investor" ? "Staked" : "LST"} color={mode === "investor" ? "#34d399" : "#8b5cf6"} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: 980 }}>
            <thead>
              <tr style={{ color: "#98b3e9", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
                <th align="left">Rank</th>
                <th align="left">Chain</th>
                <th align="right">Token Price</th>
                <th align="right">TVL</th>
                <th align="right">Circulating</th>
                <th align="right">Circ / Max</th>
                <th align="right">Staked %</th>
                <th align="right">LST %</th>
                <th align="right">24h</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ratio = r.max ? ((r.circ ?? 0) / r.max) * 100 : 0;
                return (
                  <tr key={r.chain} style={{ background: "rgba(10,19,40,.55)", border: "1px solid #2f4a84" }}>
                    <td style={{ padding: "10px 8px", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, fontWeight: 700 }}>{String(r.rank).padStart(2, "0")}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.chain}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.price)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.tvl)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{num(r.circ)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{r.max ? `${ratio.toFixed(1)}%` : "—"}</td>
                    <td align="right" style={{ padding: "10px 8px", color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{r.stakedPct.toFixed(1)}%</td>
                    <td align="right" style={{ padding: "10px 8px", color: "#9ec4ff", fontVariantNumeric: "tabular-nums" }}>{r.lstPct.toFixed(1)}%</td>
                    <td align="right" style={{ padding: "10px 8px", borderTopRightRadius: 10, borderBottomRightRadius: 10, color: (r.change24h ?? 0) >= 0 ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>{(r.change24h ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(r.change24h ?? 0).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#8ea6d8" }}>
          Note: Top 10 rotates by live TVL ranking. Fogo is always displayed as fixed #11. Staked/LST are command-deck model indicators.
        </p>
      </div>
    </section>
  );
}
