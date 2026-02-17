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
  tpsSource?: string;
  txSource?: string;
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
  const points = values.map((v, i) => `${i * step},${h - ((v - min) / span) * h}`).join(" ");
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

async function fetchEvmTps(chain: string): Promise<number | undefined> {
  const rpc = EVM_RPC[chain];
  if (!rpc) return undefined;
  try {
    const req = (blockHex: string, full = false) =>
      fetch(rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: [blockHex, full] }),
      });

    const latestRes = await req("latest", true);
    const latest = (await latestRes.json())?.result;
    if (!latest) return undefined;

    const latestNum = parseInt(latest.number, 16);
    const sampleBlocks = 20;
    const olderNum = Math.max(0, latestNum - sampleBlocks);

    const olderRes = await req("0x" + olderNum.toString(16), true);
    const older = (await olderRes.json())?.result;
    if (!older) return undefined;

    const tLatest = parseInt(latest.timestamp, 16);
    const tOlder = parseInt(older.timestamp, 16);
    const dt = Math.max(1, tLatest - tOlder);

    let txCount = 0;
    for (let n = olderNum + 1; n <= latestNum; n++) {
      const bRes = await req("0x" + n.toString(16), true);
      const b = (await bRes.json())?.result;
      txCount += Array.isArray(b?.transactions) ? b.transactions.length : 0;
    }

    return txCount / dt;
  } catch {
    return undefined;
  }
}

async function fetchSolanaTps(): Promise<number | undefined> {
  try {
    const r = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getRecentPerformanceSamples", params: [1] }),
    });
    const j = await r.json();
    const s = j?.result?.[0];
    if (!s) return undefined;
    return Number(s.numTransactions) / Math.max(1, Number(s.samplePeriodSecs || 1));
  } catch {
    return undefined;
  }
}

async function fetchBitcoinStats(): Promise<{ tps?: number; txns24h?: number }> {
  try {
    const r = await fetch("https://api.blockchair.com/bitcoin/stats", { cache: "no-store" });
    const j = await r.json();
    const tx24 = Number(j?.data?.transactions_24h || 0);
    if (!tx24) return {};
    return { txns24h: tx24, tps: tx24 / 86400 };
  } catch {
    return {};
  }
}

async function fetchEthereum24hTxns(): Promise<number | undefined> {
  try {
    const r = await fetch("https://api.blockchair.com/ethereum/stats", { cache: "no-store" });
    const j = await r.json();
    const tx24 = Number(j?.data?.transactions_24h || 0);
    return tx24 > 0 ? tx24 : undefined;
  } catch {
    return undefined;
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

        const tpsMap = new Map<string, { tps?: number; source?: string; tx24?: number; txSource?: string }>();
        const ethTx24 = await fetchEthereum24hTxns();

        await Promise.all(
          top10.map(async (c) => {
            if (c.name === "Solana") {
              const tps = await fetchSolanaTps();
              tpsMap.set(c.name, { tps, source: tps !== undefined ? "Solana RPC" : undefined });
              return;
            }
            if (c.name === "Bitcoin") {
              const btc = await fetchBitcoinStats();
              tpsMap.set(c.name, {
                tps: btc.tps,
                source: btc.tps !== undefined ? "Blockchair" : undefined,
                tx24: btc.txns24h,
                txSource: btc.txns24h !== undefined ? "Blockchair" : undefined,
              });
              return;
            }

            const tps = await fetchEvmTps(c.name);
            tpsMap.set(c.name, {
              tps,
              source: tps !== undefined ? "Chain RPC" : undefined,
              tx24: c.name === "Ethereum" ? ethTx24 : undefined,
              txSource: c.name === "Ethereum" && ethTx24 !== undefined ? "Blockchair" : undefined,
            });
          })
        );

        const builtTop10: Row[] = top10.map((c, i) => {
          const m = c.gecko_id ? marketMap.get(c.gecko_id) : undefined;
          const stats = tpsMap.get(c.name);
          const tps = stats?.tps;
          const hist = historyRef.current[c.name] || [];
          if (tps !== undefined && isFinite(tps)) {
            historyRef.current[c.name] = [...hist.slice(-23), tps];
          }

          return {
            rank: i + 1,
            chain: c.name,
            geckoId: c.gecko_id || undefined,
            tvl: c.tvl,
            price: m?.current_price,
            change24h: m?.price_change_percentage_24h,
            tps,
            txns24h: stats?.tx24,
            tpsSource: stats?.source,
            txSource: stats?.txSource,
          };
        });

        const built = [
          ...builtTop10,
          {
            rank: 11,
            chain: "Fogo",
            geckoId: "fogo",
            tvl: fogoTvl,
            tps: undefined,
            txns24h: undefined,
          } as Row,
        ];

        if (!alive) return;
        setRows(built);
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
    const totalTx24 = top10.reduce((a, b) => a + (b.txns24h || 0), 0);
    const tpsRows = top10.filter((r) => r.tps !== undefined);
    const avgTps = tpsRows.length ? tpsRows.reduce((a, b) => a + (b.tps || 0), 0) / tpsRows.length : 0;
    return { totalTvl, avgTvl, totalTx24, avgTps };
  }, [rows]);

  return (
    <section>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Live token intelligence deck</h2>
            <p className="sub" style={{ margin: 0 }}>Strict live TVL ranking (#1–#10), Fogo fixed #11, with no synthetic counters.</p>
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
            Trend line is pulled only from real TPS fetches. No synthetic ticker increments.
          </div>
          {rows.map((r) => {
            const leader = rows[0]?.tvl || 1;
            const bar = Math.max(4, (r.tvl / leader) * 100);
            const hist = historyRef.current[r.chain] || (r.tps !== undefined ? [r.tps] : []);
            const up = (r.change24h ?? 0) >= 0;

            const isTvlLeaderBand = r.tvl > leader * 0.6;
            const isHighTps = (r.tps || 0) > 30;
            const isVolatile = Math.abs(r.change24h || 0) > 2;

            const tint = isVolatile ? "rgba(245,158,11,.12)" : isHighTps ? "rgba(34,211,238,.10)" : isTvlLeaderBand ? "rgba(139,92,246,.12)" : "rgba(10,19,40,.58)";
            const regimeLabel = isVolatile ? "VOLATILE" : isHighTps ? "HIGH TPS" : isTvlLeaderBand ? "TVL LEADER" : "STABLE";
            const regimeColor = isVolatile ? "#ffc47d" : isHighTps ? "#9defff" : isTvlLeaderBand ? "#c8b5ff" : "#9fb3de";

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
                  <div style={{ display: "flex", justifyContent: "center" }}>{hist.length ? <Sparkline values={hist} up={up} /> : <span style={{ fontSize: 12, color: "#6f87bd" }}>—</span>}</div>
                  <div style={{ textAlign: "right", color: up ? "#92f8cc" : "#ffc47d", fontVariantNumeric: "tabular-nums" }}>{up ? "▲" : "▼"} {Math.abs(r.change24h ?? 0).toFixed(2)}%</div>
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: "#7f95c8", display: "flex", gap: 10 }}>
                  <span>TPS: {r.tpsSource || "unavailable"}</span>
                  <span>Txns(24h): {r.txSource || "unavailable"}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#8ea6d8" }}>
          Data notes: TVL is live from DeFiLlama. Prices/24h move are live from CoinGecko. TPS/Txns use only direct public sources per row; when unavailable we show “—” instead of simulating.
        </p>
      </div>
    </section>
  );
}
