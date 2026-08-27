import {
  SIDEWAYS_RULE,
  STYLE_COLS,
  TOP_N,
  fmtCagr,
  fmtCrore,
  fmtPct,
  prettyDate,
  type AnalysisResult,
  type FundProfile,
  type HoldingsResult,
} from "./mf-catalog";

type Opts = {
  analysis: AnalysisResult;
  categoryLabel: string;
  chart: string | null;
  holdings: Record<number, HoldingsResult>;
  profiles: Record<number, FundProfile>;
};

export async function downloadReport({
  analysis,
  categoryLabel,
  chart,
  holdings,
  profiles,
}: Opts) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;

  const heading = (text: string, size = 16) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 25);
    doc.text(text, M, y);
    y += size + 8;
  };
  const body = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 80);
    const lines = doc.splitTextToSize(text, W - M * 2) as string[];
    doc.text(lines, M, y);
    y += lines.length * 13 + 8;
  };

  // ---- Page 1: summary + justification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110);
  doc.text("MF Lens", M, y);
  y += 26;
  heading(`${categoryLabel} funds in a sideways ${analysis.indexLabel}`, 14);
  body(
    `Window: ${prettyDate(analysis.start)} to ${prettyDate(analysis.end)} (${analysis.window.days} days). ` +
      `Benchmark: ${analysis.indexLabel}, ${fmtPct(analysis.indexReturn)} over the window. ` +
      `${analysis.analysed} schemes screened. Generated ${new Date().toLocaleString("en-IN")}.`,
  );

  heading("Why this period counts as sideways", 12);
  body(
    `Rule: at least ${SIDEWAYS_RULE.minDays} calendar days, total drift within +/-${SIDEWAYS_RULE.maxDrift}% ` +
      `from start to end, and the entire high-to-low band inside ${SIDEWAYS_RULE.maxBand}%.\n` +
      `This window: ${analysis.window.days} days, drift ${fmtPct(analysis.window.drift)}, band ${analysis.window.band.toFixed(1)}%. ` +
      `Verdict: ${analysis.window.qualifies ? "qualifies as sideways." : "does not fully meet the rule — treat it as a custom range."}\n` +
      `Candidate windows are grown greedily from every fifth trading day, kept only while the band stays inside ${SIDEWAYS_RULE.maxBand}%, and the longest non-overlapping ones are reported.`,
  );

  if (chart) {
    const imgW = W - M * 2;
    const imgH = imgW * 0.42;
    try {
      doc.addImage(chart, "PNG", M, y, imgW, imgH);
      y += imgH + 12;
    } catch {
      /* chart capture unavailable */
    }
  }

  // ---- Page 2: leaderboard
  doc.addPage();
  y = M;
  heading("Category leaderboard", 14);
  autoTable(doc, {
    startY: y,
    head: [
      ["#", "Fund", "Return", "1Y CAGR", "3Y CAGR", "Alpha", "Sharpe", "Sortino", "Treynor", "Down-mkt", "Consist.", "Max DD", "Score"],
    ],
    body: analysis.funds.map((f, i) => [
      String(i + 1),
      f.name,
      fmtPct(f.return),
      fmtCagr(f.cagr1y),
      fmtCagr(f.cagr3y),
      fmtPct(f.alpha),
      f.sharpe === null ? "-" : f.sharpe.toFixed(2),
      f.sortino === null ? "-" : f.sortino.toFixed(2),
      f.treynor === null ? "-" : f.treynor.toFixed(2),
      `${f.drawdownReturn.toFixed(1)}%`,
      `${f.consistency.toFixed(0)}%`,
      `${f.maxDrawdown.toFixed(1)}%`,
      f.score.toFixed(2),
    ]),

    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 1: { cellWidth: 150 } },
    margin: { left: M, right: M },
  });

  // ---- Page 3: methodology + style grid
  doc.addPage();
  y = M;
  heading("Ranking methodology", 14);
  body(
    "Score = weighted percentile blend of Alpha, Sharpe, Sortino, Treynor, return on benchmark-down days, rolling 3-month win rate and max drawdown control. Ratios use trailing 3Y daily NAVs and a 6.5% risk-free rate; weights vary by category (Treynor-led for large cap, Sortino-led for mid/small, Sharpe + consistency for multi/flexi).\n" +
      "In a flat market the useful fund is the one that still made money without a deep dive to do it, so the drawdown penalty stops a volatile fund from topping the table on a lucky endpoint.\n\n" +
      "Universe: Direct plan, Growth option only. One scheme per fund house. The scheme's official AMFI category must match the selected category. The fund must have NAV coverage for at least 80% of the window.\n\n" +
      "Return: NAV change across the window. Annualised: same return scaled to a year. Max drawdown: worst peak-to-trough fall inside the window. Volatility: annualised standard deviation of daily returns. Up days: share of trading days with a positive NAV move.",
  );

  heading("Size and style placement", 13);
  body(
    "Size comes from the official AMFI category; multi-cap and flexi-cap funds are placed by which size index their daily NAV returns correlate with most. " +
      "Style is NAV-derived over a trailing three-year window: " +
      STYLE_COLS.map((c) => `${c.label} — ${c.hint}`).join(" ") +
      " This is an approximation from NAV behaviour, not an official style box.",
  );

  autoTable(doc, {
    startY: y,
    head: [["Fund", "Size", "Style", "Beta", "Up capture", "Down capture", "Momentum"]],
    body: analysis.funds.map((f) => [
      f.name,
      f.sizeBucket,
      f.styleBucket,
      f.beta.toFixed(2),
      f.upCapture.toFixed(2),
      f.downCapture.toFixed(2),
      f.momentum.toFixed(2),
    ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 118, 110] },
    columnStyles: { 0: { cellWidth: 180 } },
    margin: { left: M, right: M },
  });

  // ---- Page 4: fund managers
  const withProfiles = analysis.funds.slice(0, TOP_N).filter((f) => profiles[f.code]?.manager);
  if (withProfiles.length) {
    doc.addPage();
    y = M;
    heading("Fund managers and fund size", 14);
    autoTable(doc, {
      startY: y,
      head: [["Fund", "Manager", "Since", "Recent employment", "Also manages", "AUM"]],
      body: withProfiles.map((f) => {
        const p = profiles[f.code]!;
        return [
          f.name,
          [p.manager ?? "-", p.managerRole, p.managerExperience].filter(Boolean).join("\n"),
          p.managerSince ?? "-",
          (p.career.length
            ? p.career.map((c) => [c.organisation, c.role, c.period].filter(Boolean).join(" - "))
            : p.previousEmployment
          ).join("\n") || "-",
          p.otherFunds.join(", ") || "-",
          fmtCrore(p.aumCrore).replace("₹", "Rs "),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4, valign: "top" },
      headStyles: { fillColor: [15, 118, 110] },
      columnStyles: { 0: { cellWidth: 110 }, 4: { cellWidth: 120 } },
      margin: { left: M, right: M },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 24;

    const aums = withProfiles
      .map((f) => profiles[f.code]!.aumCrore)
      .filter((v): v is number => v !== null && v > 0);
    if (aums.length) {
      body(
        `Fund size across the ranked funds — smallest ${fmtCrore(Math.min(...aums)).replace("₹", "Rs ")}, ` +
          `largest ${fmtCrore(Math.max(...aums)).replace("₹", "Rs ")}, ` +
          `average ${fmtCrore(aums.reduce((a, b) => a + b, 0) / aums.length).replace("₹", "Rs ")}.`,
      );
    }
  }

  // ---- Page 5: holdings
  const withHoldings = analysis.funds.slice(0, TOP_N).filter((f) => holdings[f.code]?.holdings.length);
  if (withHoldings.length) {
    doc.addPage();
    y = M;
    heading("Top 10 holdings", 14);
    for (const f of withHoldings) {
      const h = holdings[f.code]!;
      heading(f.name, 11);
      body(`Source: ${h.source ?? "n/a"}${h.asOf ? ` · as of ${h.asOf}` : ""}`);
      autoTable(doc, {
        startY: y,
        head: [["#", "Stock", "Weight", "Sector"]],
        body: h.holdings.map((row, i) => [
          String(i + 1),
          row.name,
          row.weight === null ? "-" : `${row.weight.toFixed(2)}%`,
          row.sector ?? "-",
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 118, 110] },
        margin: { left: M, right: M },
      });
      y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 24;
      if (y > doc.internal.pageSize.getHeight() - 140) {
        doc.addPage();
        y = M;
      }
    }
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(
      "Mutual fund investments are subject to market risks. Read all scheme related documents carefully.",
      M,
      doc.internal.pageSize.getHeight() - 26,
    );
    doc.text(
      "MF Lens is research tooling only — not investment advice or a scheme recommendation.",
      M,
      doc.internal.pageSize.getHeight() - 16,
    );
    doc.text(`${p} / ${pages}`, W - M, doc.internal.pageSize.getHeight() - 16, { align: "right" });
  }

  doc.save(
    `mflens-${analysis.category}-${analysis.start}-to-${analysis.end}.pdf`.replace(/\s+/g, "-"),
  );
}
