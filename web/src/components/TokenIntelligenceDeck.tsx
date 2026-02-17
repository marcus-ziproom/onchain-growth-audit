"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChainApiRow = { name: string; tvl: number; gecko_id?: string | null };

type Row = {
  rank: number;
  chain: string;
  geckoId?: string;
  tvl: number;
  price?: number;
  change24h?: number;
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

const intFmt = (n?: number) => {
  if (n === undefined || !isFinite(n)) return "—";
  return Math.max(0, Math.round(n)).toLocaleString();
};

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (!values.length) return null;
  const w = 88;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / span) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        fill="none"
        stroke={up ? "#34d399" : "#f59e0b"}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function rpcCall(rpc: string, method: string, params: any[] = []) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await res.json();
  return j?.result;
}

async function fetchEvmStats(chain: string): Promise<{ tps?: number; txns24h?: number }> {
  const rpc = EVM_RPC[chain];
  if (!rpc) return {};
  try {
    const latestHex = (await rpcCall(rpc, "eth_blockNumber")) as string;
    if (!latestHex) return {};
    const latest = parseInt(latestHex, 16);
    const windowBlocks = 120;
    const start = Math.max(0, latest - windowBlocks);

    const [latestBlock, startBlock] = await Promise.all([
      rpcCall(rpc, "eth_getBlockByNumber", [`0x${latest.toString(16)}`, false]),
      rpcCall(rpc, "eth_getBlockByNumber", [`0x${start.toString(16)}`, false]),
    ]);
    if (!latestBlock || !startBlock) return {};

    const [latestTxHex, startTxHex] = await Promise.all([
      rpcCall(rpc, "eth_getBlockTransactionCountByNumber", [`0x${latest.toString(16)}`]),
      rpcCall(rpc, "eth_getBlockTransactionCountByNumber", [`0x${start.toString(16)}`]),
    ]);

    const t1 = parseInt(latestBlock.timestamp, 16);
    const t0 = parseInt(startBlock.timestamp, 16);
    const dt = Math.max(1, t1 - t0);

    const txN = parseInt(latestBlock.number, 16);
    const txCountNow = latestTxHex ? parseInt(latestTxHex, 16) : 0;
    const txCountStart = startTxHex ? parseInt(startTxHex, 16) : 0;

    const avgTxPerBlock = Math.max(0, (txCountNow + txCountStart) / 2);
    const blocks = Math.max(1, txN - parseInt(startBlock.number, 16));
    const sampledTx = avgTxPerBlock * blocks;

    const tps = sampledTx / dt;
    const txns24h = tps * 86400;
    return { tps: isFinite(tps) ? tps : undefined, txns24h: isFinite(txns24h) ? txns24h : undefined };
  } catch {
    return {};
  }
}

async function fetchSolanaStats(): Promise<{ tps?: number; txns24h?: number }> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getRecentPerformanceSamples", params: [60] }),
    });
    const j = await r.json();
    const samples = Array.isArray(j?.result) ? j.result : [];
    if (!samples.length) return {};
    const totalTx = samples.reduce((a: number, s: any) => a + Number(s?.numTransactions || 0), 0);
    const totalSecs = samples.reduce((a: number, s: any) => a + Number(s?.samplePeriodSecs || 0), 0);
    if (!totalTx || !totalSecs) return {};
    const tps = totalTx / totalSecs;
    return { tps, txns24h: tps * 86400 };
  } catch {
    return {};
  }
}

async function fetchBitcoinStats(): Promise<{ tps?: number; txns24h?: number }> {
  try {
    const r = await fetch("https://blockchain.info/q/24hrtransactioncount", { cache: "no-store" });
    const t = await r.text();
    const tx24 = Number(t.trim());
    if (!tx24 || !isFinite(tx24)) return {};
    return { txns24h: tx24, tps: tx24 / 86400 };
  } catch {
    return {};
  }
}

export default function TokenIntelligenceDeck() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updated, setUpdated] = useState("--:--:--");
  const historyRef = useRef<Record<string, number[]>>({});

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

        const ids = Array.from(new Set(top10.map((c) => c.gecko_id).filter(Boolean))) as string[];
        let marketMap = new Map<string, any>();
        if (ids.length) {
          try {
            const mRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}&price_change_percentage=24h`, { cache: "no-store" });
            const mk = (await mRes.json()) as any[];
            marketMap = new Map(mk.map((m) => [m.id, m]));
          } catch {}
        }

        const statMap = new Map<string, { tps?: number; txns24h?: number }>();
        await Promise.all(
          top10.map(async (c) => {
            let stats: { tps?: number; txns24h?: number } = {};
            if (c.name === "Solana") stats = await fetchSolanaStats();
            else if (c.name === "Bitcoin") stats = await fetchBitcoinStats();
            else stats = await fetchEvmStats(c.name);
            statMap.set(c.name, stats);
          })
        );

        const builtTop10: Row[] = top10.map((c, i) => {
          const m = c.gecko_id ? marketMap.get(c.gecko_id) : undefined;
          const stats = statMap.get(c.name) || {};
          return {
            rank: i + 1,
            chain: c.name,
            geckoId: c.gecko_id || undefined,
            tvl: c.tvl,
            price: m?.current_price,
            change24h: m?.price_change_percentage_24h,
            tps: stats.tps,
            txns24h: stats.txns24h,
          };
        });

        const built = [
          ...builtTop10,
          {
            rank: 11,
            chain: "Fogo",
            geckoId: "fogo",
            tvl: fogoTvl,
          } as Row,
        ];

        if (!alive) return;
        setRows((prev) =>
          built.map((n) => {
            const p = prev.find((x) => x.chain === n.chain);
            const nextTps = n.tps ?? p?.tps;
            if (nextTps !== undefined) {
              const hist = historyRef.current[n.chain] || [];
              historyRef.current[n.chain] = [...hist.slice(-23), nextTps];
            }
            return {
              ...n,
              tps: nextTps,
              txns24h: n.txns24h ?? p?.txns24h,
            };
          })
        );
        setUpdated(new Date().toLocaleTimeString());
      } catch {
        // keep current data
      }
    };

    pull();
    const id = setInterval(pull, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const command = useMemo(() => {
    if (!rows.length) return { totalTvl: 0, avgTvl: 0, totalTx24: 0, avgTps: 0 };
    const top10 = rows.slice(0, 10);
    const totalTvl = top10.reduce((a, b) => a + b.tvl, 0);
    const avgTvl = totalTvl / Math.max(top10.length, 1);
    const txRows = top10.filter((r) => r.txns24h !== undefined);
    const tpsRows = top10.filter((r) => r.tps !== undefined);
    const totalTx24 = txRows.reduce((a, b) => a + (b.txns24h || 0), 0);
    const avgTps = tpsRows.length ? tpsRows.reduce((a, b) => a + (b.tps || 0), 0) / tpsRows.length : 0;
    return { totalTvl, avgTvl, totalTx24, avgTps };
  }, [rows]);

  return (
    <section>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live token intelligence deck</h2>
            <p className="sub" style={{ margin: 0 }}>Strict live TVL ranking (#1–#10), Fogo fixed #11, with per-row live signal visuals.</p>
          </div>
          <div style={{ fontSize: 12, color: "#9fb3de", border: "1px solid #35508f", borderRadius: 999, padding: "6px 10px" }}>Live sync {updated}</div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}><div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Top-10 TVL</div><div style={{ fontWeight: 900, fontSize: 24, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{usd(command.totalTvl)}</div></div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}><div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Avg TVL</div><div style={{ fontWeight: 900, fontSize: 24, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{usd(command.avgTvl)}</div></div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}><div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Txns (24h)</div><div style={{ fontWeight: 900, fontSize: 24, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{compact(command.totalTx24)}</div></div>
          <div style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: 10, background: "rgba(10,19,40,.6)" }}><div style={{ fontSize: 11, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Avg TPS</div><div style={{ fontWeight: 900, fontSize: 24, color: "#9df1d0", fontVariantNumeric: "tabular-nums" }}>{command.avgTps.toFixed(2)}</div></div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 180px 1fr 120px 100px 110px 100px", gap: 8, alignItems: "center", color: "#9fb3de", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", padding: "0 10px" }}>
            <div>Rank</div>
            <div>Chain</div>
            <div>TVL bar + Price</div>
            <div style={{ textAlign: "right" }}>Txns (24h)</div>
            <div style={{ textAlign: "right" }}>TPS</div>
            <div style={{ textAlign: "center" }}>TPS Trend</div>
            <div style={{ textAlign: "right" }}>24h %</div>
          </div>
          <div style={{ color: "#8ea6d8", fontSize: 11, padding: "0 10px 4px" }}>
            Trend line = sampled TPS from live pulls only (no synthetic interpolation).
          </div>
          {rows.map((r) => {
            const leader = rows[0]?.tvl || 1;
            const bar = Math.max(4, (r.tvl / leader) * 100);
            const hist = historyRef.current[r.chain] || (r.tps !== undefined ? [r.tps] : []);
            const up = (r.change24h ?? 0) >= 0;

            const isTvlLeaderBand = r.tvl > leader * 0.6;
            const isHighTps = (r.tps || 0) > 30;
            const isVolatile = Math.abs(r.change24h || 0) > 2;

            const tint = isVolatile
              ? "rgba(245,158,11,.12)"
              : isHighTps
              ? "rgba(34,211,238,.10)"
              : isTvlLeaderBand
              ? "rgba(139,92,246,.12)"
              : "rgba(10,19,40,.58)";

            const regimeLabel = isVolatile
              ? "VOLATILE"
              : isHighTps
              ? "HIGH TPS"
              : isTvlLeaderBand
              ? "TVL LEADER"
              : "STABLE";

            const regimeColor = isVolatile
              ? "#ffc47d"
              : isHighTps
              ? "#9defff"
              : isTvlLeaderBand
              ? "#c8b5ff"
              : "#9fb3de";

            return (
              <div key={r.chain} style={{ border: "1px solid #2f4a84", borderRadius: 12, padding: "8px 10px", background: tint }}>
                <div style={{ display: "grid", gridTemplateColumns: "44px 180px 1fr 120px 100px 110px 100px", gap: 8, alignItems: "center" }}>
                  <div style={{ fontWeight: 800, color: "#9ec4ff" }}>#{String(r.rank).padStart(2, "0")}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.chain}</div>
                    <div style={{ fontSize: 10, color: regimeColor, letterSpacing: ".08em", textTransform: "uppercase" }}>{regimeLabel}</div>
                  </div>
                  <div>
                    <div style={{ height: 7, borderRadius: 999, background: "rgba(80,105,170,.35)", overflow: "hidden" }}>
                      <div style={{ width: `${bar}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22d3ee,#8b5cf6,#ec4899)", transition: "width .6s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9fb3de", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>TVL {usd(r.tvl)} {r.price !== undefined ? `• Price ${usd(r.price)}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{intFmt(r.txns24h)}</div>
                  <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.tps !== undefined ? r.tps.toFixed(2) : "—"}</div>
                  <div style={{ display: "flex", justifyContent: "center" }}><Sparkline values={hist} up={up} /></div>
                  <div style={{ textAlign: "right", color: up ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>{up ? "▲" : "▼"} {Math.abs(r.change24h ?? 0).toFixed(2)}%</div>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#8ea6d8" }}>
          Data notes: TVL ranking is live from DeFiLlama. TPS/Txns use live chain RPC/API sampling only; if a chain has no reachable public telemetry route, values are shown as unavailable (—).
        </p>
      </div>
    </section>
  );
}
