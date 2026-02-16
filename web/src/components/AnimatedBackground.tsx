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

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      points.length = 0;
      const count = Math.min(80, Math.floor(window.innerWidth / 18));
      for (let i = 0; i < count; i++) {
        points.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.4,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const g = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
      g.addColorStop(0, "rgba(34,211,238,0.16)");
      g.addColorStop(0.5, "rgba(139,92,246,0.14)");
      g.addColorStop(1, "rgba(236,72,153,0.10)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

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
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(120,230,255,${(1 - d / 120) * 0.18})`;
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
