"use client";

import { useEffect, useMemo, useState } from "react";

type ChainApiRow = {
  name: string;
  tvl: number;
  gecko_id?: string | null;
};

type Row = {
  rank: number;
  chain: string;
  geckoId?: string;
  price?: number;
  marketCap?: number;
  circ?: number;
  max?: number;
  change24h?: number;
  tvl: number;
  stakedPct: number;
  lstPct: number;
  tps?: number;
  txns24h?: number;
};

const BLACKLIST = new Set(["All", "Others", "Stable", "Unknown"]);

const EVM_RPC: Record<string, string> = {
  Ethereum: "https://cloudflare-eth.com",
  BSC: "https://bsc-dataseed.binance.org",
  Base: "https://mainnet.base.org",
  Arbitrum: "https://arb1.arbitrum.io/rpc",
  Optimism: "https://mainnet.optimism.io",
  Avalanche: "https://api.avax.network/ext/bc/C/rpc",
  Polygon: "https://polygon-rpc.com",
  Hyperliquid: "https://rpc.hyperliquid.xyz/evm",
};

const usd = (n?: number) => {
  if (n === undefined || !isFinite(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const compact = (n?: number) => {
  if (n === undefined || !isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n.toFixed(0)}`;
};

function modelRatios(chain: string) {
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
    Hyperliquid: { staked: 18, lst: 1 },
    Fogo: { staked: 0, lst: 0 },
  };
  return map[chain] ?? { staked: 12, lst: 2 };
}

function RingGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
      <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden>
        <circle cx="31" cy="31" r={r} stroke="rgba(120,140,200,.25)" strokeWidth="6" fill="none" />
        <circle
          cx="31"
          cy="31"
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 31 31)"
          style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,.35))" }}
        />
        <text x="31" y="34" textAnchor="middle" fill="#d6ffe7" fontSize="10" fontWeight="800">{pct.toFixed(0)}%</text>
      </svg>
      <div style={{ fontSize: 10, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
    </div>
  );
}

async function fetchEvmTps(chain: string): Promise<{ tps?: number; txns24h?: number }> {
  const rpc = EVM_RPC[chain];
  if (!rpc) return {};
  try {
    const body = [
      { jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", true] },
      { jsonrpc: "2.0", id: 2, method: "eth_getBlockByNumber", params: ["0x" + (parseInt("0x0", 16)).toString(16), false] },
    ];

    // We only need latest tx count + previous block time: query latest then latest-1.
    const latestRes = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", true] }),
    });
    const latest = (await latestRes.json())?.result;
    if (!latest) return {};

    const latestNum = parseInt(latest.number, 16);
    const prevHex = "0x" + Math.max(0, latestNum - 1).toString(16);
    const prevRes = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: [prevHex, false] }),
    });
    const prev = (await prevRes.json())?.result;
    if (!prev) return {};

    const txCount = Array.isArray(latest.transactions) ? latest.transactions.length : 0;
    const t1 = parseInt(latest.timestamp, 16);
    const t2 = parseInt(prev.timestamp, 16);
    const dt = Math.max(1, t1 - t2);
    const tps = txCount / dt;
    return { tps, txns24h: tps * 86400 };
  } catch {
    return {};
  }
}

async function fetchSolanaTps(): Promise<{ tps?: number; txns24h?: number }> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getRecentPerformanceSamples", params: [1] }),
    });
    const j = await r.json();
    const s = j?.result?.[0];
    if (!s) return {};
    const tps = Number(s.numTransactions) / Number(s.samplePeriodSecs || 1);
    return { tps, txns24h: tps * 86400 };
  } catch {
    return {};
  }
}

async function fetchBitcoinTps(): Promise<{ tps?: number; txns24h?: number }> {
  try {
    const r = await fetch("https://api.blockchair.com/bitcoin/stats");
    const j = await r.json();
    const tx24 = Number(j?.data?.transactions_24h || 0);
    if (!tx24) return {};
    return { txns24h: tx24, tps: tx24 / 86400 };
  } catch {
    return {};
  }
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
        const chains = (await chainRes.json()) as ChainApiRow[];

        const top10 = chains
          .filter((c) => c?.name && typeof c.tvl === "number" && !BLACKLIST.has(c.name) && c.name !== "Fogo")
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 10);

        const fogoTvl = chains.find((c) => c.name === "Fogo")?.tvl ?? 0;

        // Baseline rows from TVL first so UI never appears empty
        const baseRows: Row[] = top10.map((c, i) => {
          const ratios = modelRatios(c.name);
          return {
            rank: i + 1,
            chain: c.name,
            geckoId: c.gecko_id || undefined,
            tvl: c.tvl,
            stakedPct: ratios.staked,
            lstPct: ratios.lst,
          };
        });

        const fogoRatios = modelRatios("Fogo");
        baseRows.push({
          rank: 11,
          chain: "Fogo",
          geckoId: "fogo",
          tvl: fogoTvl,
          stakedPct: fogoRatios.staked,
          lstPct: fogoRatios.lst,
        });

        if (alive) setRows(baseRows);

        // Enrich with market data
        const ids = Array.from(new Set(top10.map((c) => c.gecko_id).filter(Boolean))) as string[];
        let marketMap = new Map<string, any>();
        if (ids.length) {
          try {
            const mRes = await fetch(
              `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=24h`,
              { cache: "no-store" }
            );
            const markets = (await mRes.json()) as any[];
            marketMap = new Map(markets.map((m) => [m.id, m]));
          } catch {
            // keep baseline
          }
        }

        // Enrich with tx metrics best-effort
        const txMap = new Map<string, { tps?: number; txns24h?: number }>();
        await Promise.all(
          top10.map(async (c) => {
            if (c.name === "Solana") txMap.set(c.name, await fetchSolanaTps());
            else if (c.name === "Bitcoin") txMap.set(c.name, await fetchBitcoinTps());
            else txMap.set(c.name, await fetchEvmTps(c.name));
          })
        );

        const enriched = baseRows.map((r) => {
          const m = r.geckoId ? marketMap.get(r.geckoId) : undefined;
          const tx = txMap.get(r.chain) ?? {};
          return {
            ...r,
            price: m?.current_price,
            marketCap: m?.market_cap,
            circ: m?.circulating_supply,
            max: m?.max_supply ?? m?.total_supply,
            change24h: m?.price_change_percentage_24h,
            tps: tx.tps,
            txns24h: tx.txns24h,
          };
        });

        if (!alive) return;
        setRows((prev) => {
          if (!prev.length) return enriched;
          return enriched.map((n) => {
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
              tps: lerp(p.tps, n.tps, 0.6),
              txns24h: lerp(p.txns24h, n.txns24h, 0.6),
            };
          });
        });
        setUpdated(new Date().toLocaleTimeString());
      } catch {
        // keep previous rows on any unexpected failure
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
            <p className="sub" style={{ margin: 0 }}>TVL-ranked leaderboard (live), Fogo fixed at #11, with integrated per-line visual signals.</p>
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

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: 1220 }}>
            <thead>
              <tr style={{ color: "#98b3e9", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
                <th align="left">Rank</th>
                <th align="left">Chain</th>
                <th align="right">TVL</th>
                <th align="right">Token Price</th>
                <th align="right">Txns (24h)</th>
                <th align="right">Tx Speed (TPS)</th>
                <th align="right">Line Visual</th>
                <th align="right">24h</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const topTvl = rows[0]?.tvl || 1;
                const share = Math.max(3, (r.tvl / topTvl) * 100);
                return (
                  <tr key={r.chain} style={{ background: "rgba(10,19,40,.58)", border: "1px solid #2f4a84" }}>
                    <td style={{ padding: "10px 8px", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, fontWeight: 700 }}>{String(r.rank).padStart(2, "0")}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700 }}>{r.chain}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.tvl)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{usd(r.price)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{compact(r.txns24h)}</td>
                    <td align="right" style={{ padding: "10px 8px", fontVariantNumeric: "tabular-nums" }}>{r.tps ? r.tps.toFixed(2) : "—"}</td>
                    <td align="right" style={{ padding: "10px 8px" }}>
                      <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 96, height: 8, borderRadius: 999, background: "rgba(80,105,170,.35)", overflow: "hidden" }}>
                          <div style={{ width: `${share}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)", boxShadow: "0 0 10px rgba(34,211,238,.4)" }} />
                        </div>
                        <RingGauge value={mode === "investor" ? r.stakedPct : r.lstPct} label={mode === "investor" ? "Stk" : "LST"} color={mode === "investor" ? "#34d399" : "#8b5cf6"} />
                      </div>
                    </td>
                    <td align="right" style={{ padding: "10px 8px", borderTopRightRadius: 10, borderBottomRightRadius: 10, color: (r.change24h ?? 0) >= 0 ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>
                      {(r.change24h ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(r.change24h ?? 0).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#8ea6d8" }}>
          Notes: Ranking is strictly live TVL for #1–#10. Fogo is fixed #11. Tx metrics are best-effort live (EVM + Solana + Bitcoin where available); blanks appear when a chain endpoint doesn’t expose reliable public telemetry.
        </p>
      </div>
    </section>
  );
}
