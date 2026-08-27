import type { AnalysisResult } from "./mf-catalog";

const SERIES: { key: "index" | "a" | "b" | "c" | "d" | "e"; color: string; dash: boolean }[] = [
  { key: "index", color: "#94a3b8", dash: true },
  { key: "a", color: "#0f766e", dash: false },
  { key: "b", color: "#b45309", dash: false },
  { key: "c", color: "#7c3aed", dash: false },
  { key: "d", color: "#be123c", dash: false },
  { key: "e", color: "#1d4ed8", dash: false },
];

/** Draws the rebased performance chart on a plain canvas (no CSS colours, so it always rasterises). */
export function renderChartPng(analysis: AnalysisResult, labels: string[]): string | null {
  if (typeof document === "undefined" || analysis.series.length < 2) return null;
  const w = 1200;
  const h = 500;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 70;
  const values = analysis.series.flatMap((p) =>
    SERIES.map((s) => p[s.key]).filter((v): v is number => typeof v === "number"),
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => padL + (i / (analysis.series.length - 1)) * (w - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / span) * (h - padT - padB);

  ctx.strokeStyle = "#e2e8f0";
  ctx.fillStyle = "#64748b";
  ctx.font = "16px Helvetica, Arial, sans-serif";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = min + (span * g) / 4;
    const yy = y(v);
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(w - padR, yy);
    ctx.stroke();
    ctx.fillText(v.toFixed(0), 12, yy + 5);
  }

  ctx.textAlign = "center";
  const step = Math.max(1, Math.floor(analysis.series.length / 6));
  analysis.series.forEach((p, i) => {
    if (i % step !== 0) return;
    ctx.fillText(p.date.slice(2, 10), x(i), h - padB + 24);
  });
  ctx.textAlign = "left";

  ctx.lineWidth = 2.5;
  for (const s of SERIES) {
    ctx.strokeStyle = s.color;
    ctx.setLineDash(s.dash ? [8, 6] : []);
    ctx.beginPath();
    let started = false;
    analysis.series.forEach((p, i) => {
      const v = p[s.key];
      if (typeof v !== "number") return;
      if (started) ctx.lineTo(x(i), y(v));
      else {
        ctx.moveTo(x(i), y(v));
        started = true;
      }
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);

  let lx = padL;
  ctx.font = "14px Helvetica, Arial, sans-serif";
  const legend = [analysis.indexLabel, ...labels].slice(0, SERIES.length);
  legend.forEach((label, i) => {
    const s = SERIES[i]!;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, h - 20);
    ctx.lineTo(lx + 26, h - 20);
    ctx.stroke();
    ctx.fillStyle = "#334155";
    const text = label.length > 34 ? `${label.slice(0, 33)}…` : label;
    ctx.fillText(text, lx + 32, h - 15);
    lx += 40 + ctx.measureText(text).width;
  });

  return canvas.toDataURL("image/png");
}
