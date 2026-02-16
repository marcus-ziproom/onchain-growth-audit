"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; label: string };

const LABELS = ["ETH","SOL","TRX","BNB","ARB","OP","AVAX","SUI","MATIC","BTC"];

export default function ChainConstellation() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const nodes: Node[] = [];

    const resize = () => {
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = 280;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      nodes.length = 0;
      for (let i = 0; i < LABELS.length; i++) {
        nodes.push({
          x: Math.random() * (w - 60) + 30,
          y: Math.random() * (h - 60) + 30,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 4 + Math.random() * 3,
          label: LABELS[i],
        });
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(34,211,238,.10)");
      bg.addColorStop(1, "rgba(139,92,246,.10)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 16 || a.x > w - 16) a.vx *= -1;
        if (a.y < 16 || a.y > h - 16) a.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(120,230,255,${(1 - d / 130) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        glow.addColorStop(0, "rgba(34,211,238,.45)");
        glow.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "#8ef4ff";
        ctx.fill();

        ctx.fillStyle = "#b8cfff";
        ctx.font = "10px Inter, sans-serif";
        ctx.fillText(n.label, n.x + 8, n.y - 8);
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} style={{ width: "100%", borderRadius: 14, border: "1px solid #2f4a84", display: "block" }} />;
}
