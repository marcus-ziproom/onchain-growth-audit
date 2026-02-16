"use client";

import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";
import Reveal from "@/components/Reveal";
import { trackEvent } from "@/lib/analytics";
import { IconBolt, IconShield, IconSignal } from "@/components/BrandIcons";
import TokenIntelligenceDeck from "@/components/TokenIntelligenceDeck";
import ChainConstellation from "@/components/ChainConstellation";

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
              <h1 className="h1"><span className="grad">Revenue-grade growth intelligence</span> for ambitious Web3 teams.</h1>
              <p className="lead">ChainPulse helps founders and growth leads turn on-chain noise into clear profit decisions—so you can improve retention, reduce token risk, and scale with confidence in 48 hours.</p>
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


        <Reveal delay={70}><TokenIntelligenceDeck /></Reveal>

        <Reveal delay={90}><section><div className="card" style={{padding:14}}><h2 style={{marginBottom:8}}>Chain constellation map</h2><p className="sub" style={{marginTop:0}}>A live visual network of top ecosystems to amplify the premium command-center feel.</p><ChainConstellation /></div></section></Reveal>

        <Reveal>
          <section id="offer">
            <h2>One high-impact offer designed to pay for itself fast.</h2>
            <p className="sub">No vague advisory. No endless calls. Just a focused audit that gives your team the exact priorities to drive measurable growth now.</p>
            <div className="grid offer-grid">
              <article className="card">
                <h3 style={{ marginTop: 0, fontSize: 30 }}>What you get</h3>
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
                <p style={{ marginTop: 4 }}>USDC upfront • fixed scope</p>
                <p className="sub">Includes one async follow-up so your team can execute fast without losing momentum.</p>
                <Link className="btn btn-pri" style={{ width: "100%" }} href="/intake" onClick={() => trackEvent("offer_buy_click")}>Buy Audit</Link>
                <Link className="btn btn-sec" style={{ width: "100%", marginTop: 10 }} href="/report-sample" onClick={() => trackEvent("offer_sample_click")}>See Sample Output</Link>
              </aside>
            </div>
          </section>
        </Reveal>

        <Reveal delay={100}>
          <section id="process">
            <h2>How you get value in 3 steps</h2>
            <div className="grid process-grid timeline-wrap">
              <div className="card step">
                <span className="step-index">01</span><small>Step 01</small>
                <h3>Intake + Settlement</h3>
                <p className="sub">You submit your brief, chain context, and contracts. We confirm fit and send settlement instructions immediately.</p>
              </div>
              <div className="card step">
                <span className="step-index">02</span><small>Step 02</small>
                <h3>Diagnostics Engine</h3>
                <p className="sub">We identify exactly where growth leaks, where token pressure builds, and which risks can hurt momentum.</p>
              </div>
              <div className="card step">
                <span className="step-index">03</span><small>Step 03</small>
                <h3>Operator Packet</h3>
                <p className="sub">You get a board-ready report and a ranked action plan your team can ship this week.</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={180}>
          <section id="proof">
            <h2>Why teams buy ChainPulse</h2>
            <div className="grid proof-grid">
              <div className="card">
                <div className="floaty"><IconSignal /></div>
                <span className="badge">Web3-native</span>
                <h3>Proof over opinions</h3>
                <p className="sub">Analysis is anchored to observable chain behavior, not generic growth templates.</p>
              </div>
              <div className="card">
                <div className="floaty"><IconShield /></div>
                <span className="badge">Productized</span>
                <h3>Fast, focused, founder-friendly</h3>
                <p className="sub">One offer, one timeline, one output standard. Low friction for founders and operators.</p>
              </div>
              <div className="card">
                <div className="floaty"><IconBolt /></div>
                <span className="badge">Actionable</span>
                <h3>Actions your team can ship</h3>
                <p className="sub">What you get include ownership-ready action backlog and KPI operating cadence.</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={240}>
          <section>
            <div className="cta-band">
              <div>
                <b style={{ fontSize: 27 }}>Want stronger growth decisions before your next push?</b>
                <div style={{ color: "var(--muted)" }}>Secure your slot now and receive your 48-hour audit execution window.</div>
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
