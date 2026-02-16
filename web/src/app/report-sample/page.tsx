import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";

export default function ReportSamplePage() {
  return (
    <div className="site-shell">
      <AnimatedBackground />
      <Nav />
      <main className="container">
        <section style={{ padding: "40px 0" }}>
          <p><Link href="/" style={{ color: "#9fdfff" }}>← Back to site</Link></p>
          <h2>Sample Audit Output</h2>
          <p className="sub">Example structure of a delivered ChainPulse report (redacted demo format).</p>

          <div className="card">
            <h3>Executive Summary</h3>
            <p className="sub">Core finding: high inflow from campaign wallets but weak Day-7 retention and concentration risk from top 20 holders.</p>
            <div className="grid stats" style={{ marginTop: 12 }}>
              <div className="card stat"><b>18.4%</b><p>D7 retention</p></div>
              <div className="card stat"><b>61%</b><p>Top-20 holder share</p></div>
              <div className="card stat"><b>2.1x</b><p>Campaign wallet churn vs baseline</p></div>
              <div className="card stat"><b>+27%</b><p>Projected lift from top fixes</p></div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
            <div className="card">
              <h3>Risk Map (sample)</h3>
              <ul>
                <li>High unlock clustering in 30-day window</li>
                <li>Whale wallet overlap with low-engagement cohorts</li>
                <li>Incentive loop generating mercenary behavior</li>
              </ul>
            </div>
            <div className="card">
              <h3>Action Backlog (sample)</h3>
              <ol>
                <li>Reweight rewards by retained behavior, not one-time actions</li>
                <li>Introduce anti-farm friction in campaign funnel</li>
                <li>Stagger unlock communications + treasury contingency</li>
              </ol>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h3>What clients receive</h3>
            <ul>
              <li>PDF report with evidence and findings</li>
              <li>Action sheet with owners + priority</li>
              <li>KPI list and weekly tracking thresholds</li>
            </ul>
            <p><Link className="btn btn-pri" href="/intake">Proceed to Intake</Link></p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
