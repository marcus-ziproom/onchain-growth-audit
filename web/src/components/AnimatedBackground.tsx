"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const points: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    let t = 0;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      points.length = 0;
      const count = Math.min(95, Math.floor(window.innerWidth / 16));
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.8 + 0.4,
        });
      }
    };

    const drawGrid = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const horizon = h * 0.62;
      ctx.save();
      ctx.strokeStyle = "rgba(120,170,255,.14)";
      ctx.lineWidth = 1;

      // perspective horizontal lines
      for (let i = 0; i < 14; i++) {
        const y = horizon + i * (i * 2.4 + 8);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // perspective vertical lines
      const center = w / 2;
      for (let i = -10; i <= 10; i++) {
        const xTop = center + i * 24;
        const xBot = center + i * 88;
        ctx.beginPath();
        ctx.moveTo(xTop, horizon);
        ctx.lineTo(xBot, h);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawWireSphere = () => {
      const w = window.innerWidth;
      const cx = w * 0.82;
      const cy = window.innerHeight * 0.2;
      const r = 86;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(142,232,255,.28)";
      ctx.lineWidth = 1;
      ctx.rotate(Math.sin(t * 0.6) * 0.35);
      for (let i = -4; i <= 4; i++) {
        const rr = r * Math.cos((i / 5) * Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, i * 12, rr, r * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        ctx.save();
        ctx.rotate((i / 9) * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const g = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
      g.addColorStop(0, "rgba(34,211,238,0.14)");
      g.addColorStop(0.5, "rgba(139,92,246,0.12)");
      g.addColorStop(1, "rgba(236,72,153,0.09)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const blobs = [
        { x: window.innerWidth * 0.2 + Math.sin(t * 1.4) * 120, y: window.innerHeight * 0.28 + Math.cos(t * 0.9) * 80, r: 260, c: "rgba(34,211,238,0.14)" },
        { x: window.innerWidth * 0.78 + Math.cos(t * 1.1) * 140, y: window.innerHeight * 0.22 + Math.sin(t * 1.2) * 70, r: 280, c: "rgba(139,92,246,0.16)" },
        { x: window.innerWidth * 0.52 + Math.sin(t * 0.7) * 160, y: window.innerHeight * 0.8 + Math.cos(t * 0.8) * 90, r: 240, c: "rgba(236,72,153,0.10)" },
      ];
      blobs.forEach((b) => {
        const rg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        rg.addColorStop(0, b.c);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      drawGrid();
      drawWireSphere();

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(167,244,255,.9)";
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 110) {
            ctx.strokeStyle = `rgba(120,230,255,${(1 - d / 110) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
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

  return (
    <>
      <canvas ref={ref} className="bg-canvas" />
      <div className="fx-noise" />
      <div className="fx-scan" />
      <div className="fx-flicker" />
      <div className="fx-vignette" />
    </>
  );
}
