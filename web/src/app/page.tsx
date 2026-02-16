"use client";

import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";
import Reveal from "@/components/Reveal";
import { trackEvent } from "@/lib/analytics";
import { IconBolt, IconShield, IconSignal } from "@/components/BrandIcons";

export default function Home() {
  return (
    <div className="site-shell">
      <AnimatedBackground />
      <Nav />

      <main className="container">
        <section className="hero">
          <div className="hero-grid">
            <div>
              <span className="pill">Trading as ChainPulse Labs • Operated by AJAP UK Ltd</span>
              <h1 className="h1"><span className="grad">Protocol-grade growth intelligence</span> for token ecosystems.</h1>
              <p className="lead">ChainPulse delivers decision-quality on-chain diagnostics for teams that need sharper retention, healthier token dynamics, and measurable growth direction in 48 hours.</p>
              <div className="hero-cta">
                <Link className="btn btn-pri" href="/intake" onClick={() => trackEvent("hero_intake_click")}>Start Intake</Link>
                <Link className="btn btn-sec" href="/report-sample" onClick={() => trackEvent("hero_sample_click")}>View Report Sample</Link>
              </div>

              <div className="marquee"><div className="marquee-track"><span>Behavior Cohorts</span><span>Holder Concentration</span><span>Emissions Stress</span><span>Growth Leak Mapping</span><span>KPI Operating Layer</span><span>Behavior Cohorts</span><span>Holder Concentration</span><span>Emissions Stress</span><span>Growth Leak Mapping</span><span>KPI Operating Layer</span></div></div>
            </div>

            <aside className="neon-panel">
              <div className="signal-title">Live Product Signal</div>
              <h3 style={{ margin: "0 0 10px", fontSize: 26 }}>48-Hour On-Chain Growth + Tokenomics Audit</h3>
              <div className="metric-stack">
                <div className="metric"><b>$1,200 USDC</b><span>Fixed fee, upfront, scope-locked</span></div>
                <div className="metric"><b>48h</b><span>Turnaround after intake completion</span></div>
                <div className="metric"><b>10+</b><span>Prioritized actions by impact</span></div>
              </div>
            </aside>
          </div>
        </section>

        <Reveal>
          <section id="offer">
            <h2>One premium offer. Built for operator speed.</h2>
            <p className="sub">No bloated consulting retainer. One focused engagement with clear input requirements and high-leverage output.</p>
            <div className="grid offer-grid">
              <article className="card">
                <h3 style={{ marginTop: 0, fontSize: 30 }}>Deliverables</h3>
                <ul>
                  <li>Wallet/user funnel diagnostics across acquisition → activation → retention</li>
                  <li>Holder concentration + token flow risk map</li>
                  <li>Incentive and emissions stress check</li>
                  <li>Competitive token dynamics snapshot</li>
                  <li>Impact-ranked 14-day execution backlog</li>
                  <li>KPI operating layer with thresholds and weekly cadence</li>
                </ul>
              </article>
              <aside className="card">
                <div style={{ fontSize: 12, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Engagement</div>
                <div className="price">$1,200</div>
                <p style={{ marginTop: 4 }}>USDC upfront</p>
                <p className="sub">Includes one async follow-up clarification round after delivery.</p>
                <Link className="btn btn-pri" style={{ width: "100%" }} href="/intake" onClick={() => trackEvent("offer_buy_click")}>Buy Audit</Link>
                <Link className="btn btn-sec" style={{ width: "100%", marginTop: 10 }} href="/report-sample" onClick={() => trackEvent("offer_sample_click")}>See Sample Output</Link>
              </aside>
            </div>
          </section>
        </Reveal>

        <Reveal delay={100}>
          <section id="process">
            <h2>Execution flow</h2>
            <div className="grid process-grid">
              <div className="card step">
                <small>Step 01</small>
                <h3>Intake + Settlement</h3>
                <p className="sub">You submit project brief, chain focus, and key contract/token addresses. We respond with USDC settlement instructions.</p>
              </div>
              <div className="card step">
                <small>Step 02</small>
                <h3>Diagnostics Engine</h3>
                <p className="sub">We map behavior cohorts, retention leakage, holder risk, and economic pressure points for your current state.</p>
              </div>
              <div className="card step">
                <small>Step 03</small>
                <h3>Operator Packet</h3>
                <p className="sub">You receive a report + ranked action system your team can execute immediately.</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={180}>
          <section id="proof">
            <h2>Why this converts for teams</h2>
            <div className="grid proof-grid">
              <div className="card">
                <div className="floaty"><IconSignal /></div>
                <span className="badge">Web3-native</span>
                <h3>On-chain evidence first</h3>
                <p className="sub">Analysis is anchored to observable chain behavior, not generic growth templates.</p>
              </div>
              <div className="card">
                <div className="floaty"><IconShield /></div>
                <span className="badge">Productized</span>
                <h3>Fixed scope, premium quality</h3>
                <p className="sub">One offer, one timeline, one output standard. Low friction for founders and operators.</p>
              </div>
              <div className="card">
                <div className="floaty"><IconBolt /></div>
                <span className="badge">Actionable</span>
                <h3>Built for immediate execution</h3>
                <p className="sub">Deliverables include ownership-ready action backlog and KPI operating cadence.</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={240}>
          <section>
            <div className="cta-band">
              <div>
                <b style={{ fontSize: 27 }}>Need decision quality before launch or spend?</b>
                <div style={{ color: "var(--muted)" }}>Secure your intake slot and start the 48-hour execution window.</div>
              </div>
              <Link className="btn btn-pri" href="/intake" onClick={() => trackEvent("bottom_cta_click")}>Proceed to Intake</Link>
            </div>
          </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
