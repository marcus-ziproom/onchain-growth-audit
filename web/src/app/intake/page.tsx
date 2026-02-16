import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";

export default function IntakePage() {
  return (
    <div className="site-shell">
      <AnimatedBackground />
      <Nav />
      <main className="container">
        <section style={{ padding: "40px 0" }}>
          <p><Link href="/" style={{ color: "#9fdfff" }}>← Back to site</Link></p>
          <h2>Audit Intake Brief</h2>
          <p className="sub">Complete this brief. We’ll reply with USDC settlement instructions and confirm your 48-hour delivery window.</p>

          <div className="card">
            <form action="mailto:hello@chainpulselabs.com" method="post" encType="text/plain">
              <div className="form-grid">
                <div><label>Project Name</label><input name="project_name" required /></div>
                <div><label>Website URL</label><input name="website_url" type="url" required /></div>
              </div>

              <div className="form-grid">
                <div>
                  <label>Primary Chain</label>
                  <select name="primary_chain"><option>Ethereum</option><option>Base</option><option>Arbitrum</option><option>Solana</option><option>Polygon</option><option>Other</option></select>
                </div>
                <div>
                  <label>Stage</label>
                  <select name="stage"><option>Pre-launch</option><option>Post-launch</option><option>Growth</option></select>
                </div>
              </div>

              <label>Token / Contract Addresses (comma separated)</label>
              <textarea name="addresses" placeholder="0x..., 0x..." />

              <label>Main Objective (next 30 days)</label>
              <textarea name="objective" placeholder="e.g., improve retention and reduce holder concentration risk" />

              <div className="form-grid">
                <div><label>Current DAU (estimate)</label><input name="dau" /></div>
                <div><label>Monthly On-chain Volume (estimate)</label><input name="monthly_volume" /></div>
              </div>

              <label>Links (Dune, Flipside, docs, deck)</label>
              <textarea name="links" />

              <label>Priority Constraints / Risks</label>
              <textarea name="risks" />

              <button className="btn btn-pri" type="submit" style={{ border: 0, marginTop: 12 }}>Submit Intake</button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
