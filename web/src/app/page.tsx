"use client";

import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";
import Reveal from "@/components/Reveal";
import { trackEvent } from "@/lib/analytics";

export default function Home() {
  return (
    <div className="site-shell">
      <AnimatedBackground />
      <Nav />

      <main className="container">
        <section className="hero">
          <span className="pill">Trading as ChainPulse Labs • Operated by AJAP UK Ltd</span>
          <h1 className="h1 glow-title"><span className="grad">On-chain growth intelligence</span> for serious crypto teams.</h1>
          <p className="lead">Decision-grade diagnostics on user behavior, token mechanics, and growth leakage—delivered in 48 hours, fully async.</p>
          <div className="hero-cta">
            <Link className="btn btn-pri" href="/intake" onClick={() => trackEvent("hero_intake_click")}>Proceed to Intake</Link>
            <Link className="btn btn-sec" href="/report-sample" onClick={() => trackEvent("hero_sample_click")}>View Sample Report</Link>
          </div>

          <div className="marquee"><div className="marquee-track"><span>Token Dynamics</span><span>Retention Intelligence</span><span>Holder Risk Mapping</span><span>Liquidity Behavior</span><span>Growth Leak Detection</span><span>Token Dynamics</span><span>Retention Intelligence</span><span>Holder Risk Mapping</span><span>Liquidity Behavior</span><span>Growth Leak Detection</span></div></div>

          <div className="grid stats">
            <div className="card stat"><b>48h</b><p>turnaround after complete intake</p></div>
            <div className="card stat"><b>$1,200</b><p>fixed USDC upfront fee</p></div>
            <div className="card stat"><b>10+</b><p>prioritized execution actions</p></div>
            <div className="card stat"><b>Async</b><p>no calls required</p></div>
          </div>
        </section>

        <Reveal><section id="offer">
          <h2>Flagship Offer</h2>
          <p className="sub">Single premium product with explicit scope and clear output quality.</p>
          <div className="grid offer">
            <article className="card">
              <h3 style={{ fontSize: 30, margin: "0 0 8px" }}>48-Hour On-Chain Growth + Tokenomics Audit</h3>
              <ul>
                <li>Wallet cohort and funnel diagnostics</li>
                <li>Holder concentration and token-flow risk map</li>
                <li>Incentive/emissions stress-check</li>
                <li>Competitive token dynamics snapshot</li>
                <li>Impact-ranked 14-day action backlog</li>
                <li>KPI operating layer and thresholds</li>
              </ul>
            </article>
            <aside className="card">
              <div style={{ fontSize: 12, color: "#9fb3de", textTransform: "uppercase", letterSpacing: ".08em" }}>Fixed Pricing</div>
              <div className="price">$1,200 USDC</div>
              <p className="sub">Paid upfront. Scope locked. Delivery in 48 hours post-intake.</p>
              <Link className="btn btn-pri" style={{ width: "100%" }} href="/intake" onClick={() => trackEvent("offer_buy_click")}>Buy Audit</Link>
              <Link className="btn btn-sec" style={{ width: "100%", marginTop: 10 }} href="/report-sample" onClick={() => trackEvent("offer_sample_click")}>See Report Sample</Link>
            </aside>
          </div>
        </section></Reveal>

        <Reveal delay={120}><section id="process">
          <h2>Delivery Process</h2>
          <div className="grid process">
            <div className="card"><h3>1) Intake + settlement</h3><p className="sub">Submit brief + addresses. Receive USDC settlement details and confirmation flow.</p></div>
            <div className="card"><h3>2) Deep diagnostics</h3><p className="sub">We run on-chain behavior and token mechanics analysis against your stated objective.</p></div>
            <div className="card"><h3>3) Execution packet</h3><p className="sub">You receive report, action backlog, and KPI framework for immediate rollout.</p></div>
          </div>
        </section></Reveal>

        <Reveal delay={220}><section>
          <div className="cta-band">
            <div>
              <b style={{ fontSize: 26 }}>Need clarity before launch or growth spend?</b>
              <div style={{ color: "var(--muted)" }}>Start with the structured intake and secure your 48-hour delivery slot.</div>
            </div>
            <Link className="btn btn-pri" href="/intake" onClick={() => trackEvent("bottom_cta_click")}>Start Intake</Link>
          </div>
        </section></Reveal>
      </main>

      <Footer />
    </div>
  );
}
