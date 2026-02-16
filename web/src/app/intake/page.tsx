"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Footer, Nav } from "@/components/SiteFrame";
import { getUtmContext, trackEvent } from "@/lib/analytics";

export default function IntakePage() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [utm, setUtm] = useState("{}");

  useEffect(() => {
    setUtm(JSON.stringify(getUtmContext()));
    trackEvent("intake_page_view");
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    trackEvent("intake_submit_attempt");

    const form = e.currentTarget;
    const fd = new FormData(form);

    fd.set("_subject", "New ChainPulse Intake");
    fd.set("_template", "table");
    fd.set("_captcha", "false");
    fd.set("_autoresponse", "Thanks — we received your brief. We’ll send USDC settlement instructions and confirm your 48-hour delivery window shortly.");

    try {
      const res = await fetch("https://formsubmit.co/ajax/hello@chainpulselabs.com", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("ok");
      trackEvent("intake_submit_success");
      form.reset();
    } catch {
      setStatus("err");
      trackEvent("intake_submit_error");
    }
  }

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
            <form onSubmit={onSubmit}>
              <input type="hidden" name="utm_context" value={utm} readOnly />

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

              <label>Business Email (for autoresponse)</label>
              <input name="email" type="email" required />

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

              <button className="btn btn-pri" type="submit" style={{ border: 0, marginTop: 12 }} disabled={status === "sending"}>
                {status === "sending" ? "Submitting…" : "Submit Intake"}
              </button>

              {status === "ok" && <p style={{ color: "#67f0bf", marginTop: 10 }}>Intake submitted. Check your email for confirmation.</p>}
              {status === "err" && <p style={{ color: "#ffb4b4", marginTop: 10 }}>Submission failed. Please retry or email hello@chainpulselabs.com.</p>}
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
