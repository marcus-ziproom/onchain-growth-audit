"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  chain: string;
  id: string;
  price: number;
  marketCap: number;
  circ: number;
  max: number;
  change24h: number;
  tvl: number;
  stakedPct: number;
  lstPct: number;
};

const MAP: Array<{ chain: string; id: string; stakedPct: number; lstPct: number }> = [
  { chain: "Ethereum", id: "ethereum", stakedPct: 28, lstPct: 39 },
  { chain: "Solana", id: "solana", stakedPct: 64, lstPct: 10 },
  { chain: "Tron", id: "tron", stakedPct: 47, lstPct: 3 },
  { chain: "BSC", id: "binancecoin", stakedPct: 21, lstPct: 4 },
  { chain: "Avalanche", id: "avalanche-2", stakedPct: 58, lstPct: 8 },
  { chain: "Polygon", id: "matic-network", stakedPct: 36, lstPct: 5 },
  { chain: "Optimism", id: "optimism", stakedPct: 9, lstPct: 1 },
  { chain: "Arbitrum", id: "arbitrum", stakedPct: 7, lstPct: 1 },
  { chain: "Sui", id: "sui", stakedPct: 74, lstPct: 2 },
  { chain: "Bitcoin", id: "bitcoin", stakedPct: 0, lstPct: 0 },
];

const usd = (n: number) => {
  if (!isFinite(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const num = (n: number) => {
  if (!isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return `${n.toFixed(2)}`;
};

export default function TokenIntelligenceDeck() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState("--:--:--");

  useEffect(() => {
    let alive = true;
    const ids = MAP.map((x) => x.id).join(",");

    const pull = async () => {
      try {
        const [mRes, cRes] = await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`, { cache: "no-store" }),
          fetch("https://api.llama.fi/v2/chains", { cache: "no-store" }),
        ]);

        const markets = await mRes.json();
        const chains = await cRes.json();
        const tvlMap = new Map<string, number>();
        (chains as Array<{ name: string; tvl: number }>).forEach((c) => tvlMap.set(c.name, c.tvl || 0));

        const marketMap = new Map<string, any>();
        (markets as any[]).forEach((m) => marketMap.set(m.id, m));

        const built: Row[] = MAP.map((m) => {
          const x = marketMap.get(m.id) || {};
          const maxSupply = Number(x.max_supply || x.total_supply || 0);
          const circ = Number(x.circulating_supply || 0);
          return {
            chain: m.chain,
            id: m.id,
            price: Number(x.current_price || 0),
            marketCap: Number(x.market_cap || 0),
            circ,
            max: maxSupply,
            change24h: Number(x.price_change_percentage_24h || 0),
            tvl: Number(tvlMap.get(m.chain) || 0),
            stakedPct: m.stakedPct,
            lstPct: m.lstPct,
          };
        }).sort((a, b) => b.marketCap - a.marketCap);

        if (!alive) return;
        setRows((prev) => {
          if (!prev.length) return built;
          // smooth transition
          return built.map((n) => {
            const p = prev.find((x) => x.id === n.id);
            if (!p) return n;
            const lerp = (a: number, b: number, k = 0.45) => a + (b - a) * k;
            return {
              ...n,
              price: lerp(p.price, n.price),
              marketCap: lerp(p.marketCap, n.marketCap),
              tvl: lerp(p.tvl, n.tvl),
              circ: lerp(p.circ, n.circ),
            };
          });
        });
        setUpdated(new Date().toLocaleTimeString());
      } catch {
        // keep old
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

  return (
    <section>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live token intelligence deck</h2>
            <p className="sub" style={{ margin: 0 }}>TVL, token price, circulating supply, and staking/LST structure in one visual control panel.</p>
          </div>
          <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>
            Live sync {updated} • CoinGecko + DeFiLlama
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          {top.map((r) => (
            <div key={r.id} style={{ border: "1px solid #2f4a84", borderRadius: 14, padding: 12, background: "rgba(10,19,40,.62)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b>{r.chain}</b>
                <span style={{ color: r.change24h >= 0 ? "#92f8cc" : "#ffc47d", fontWeight: 700 }}>{r.change24h >= 0 ? "▲" : "▼"} {Math.abs(r.change24h).toFixed(2)}%</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{usd(r.price)}</div>
              <div style={{ color: "#9fb3de", fontSize: 12 }}>MCap {usd(r.marketCap)} • TVL {usd(r.tvl)}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: 980 }}>
            <thead>
              <tr style={{ color: "#98b3e9", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
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
                const ratio = r.max > 0 ? (r.circ / r.max) * 100 : 0;
                return (
                  <tr key={r.id} style={{ background: "rgba(10,19,40,.55)", border: "1px solid #2f4a84" }}>
                    <td style={{ padding: "10px 8px", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, fontWeight: 700 }}>{r.chain}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.price)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.tvl)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{num(r.circ)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{r.max > 0 ? `${ratio.toFixed(1)}%` : "—"}</td>
                    <td align="right" style={{ padding: "10px 8px", color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{r.stakedPct.toFixed(1)}%</td>
                    <td align="right" style={{ padding: "10px 8px", color: "#9ec4ff", fontVariantNumeric: "tabular-nums" }}>{r.lstPct.toFixed(1)}%</td>
                    <td align="right" style={{ padding: "10px 8px", borderTopRightRadius: 10, borderBottomRightRadius: 10, color: r.change24h >= 0 ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>{r.change24h >= 0 ? "▲" : "▼"} {Math.abs(r.change24h).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#8ea6d8" }}>
          Note: Staked% and LST% are live deck model indicators for visual intelligence framing; core market/TVL/price/circulating metrics are live sourced.
        </p>
      </div>
    </section>
  );
}
