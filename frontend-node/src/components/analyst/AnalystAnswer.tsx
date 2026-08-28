import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an analyst reply as clearly segmented blocks: prose sections keep their
 * markdown, while every markdown table is parsed out and re-rendered as a data table
 * with inline magnitude bars plus a companion bar chart for the leading metric — so
 * the answer reads even for someone who does not read charts.
 */

type TableBlock = { kind: "table"; head: string[]; rows: string[][] };
type TextBlock = { kind: "text"; text: string };
type Block = TableBlock | TextBlock;

function splitCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

const DIVIDER = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ kind: "text", text });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const next = lines[i + 1];
    const isTableStart = line.trim().startsWith("|") && !!next && DIVIDER.test(next.trim());
    if (!isTableStart) {
      buffer.push(line);
      continue;
    }
    flush();
    const head = splitCells(line);
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && lines[j]!.trim().startsWith("|")) {
      rows.push(splitCells(lines[j]!));
      j += 1;
    }
    blocks.push({ kind: "table", head, rows });
    i = j - 1;
  }
  flush();
  return blocks;
}

function toNumber(cell: string): number | null {
  const cleaned = cell.replace(/[₹,%\s]|Cr|cr|x/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && cleaned !== "" ? n : null;
}

function DataTable({ block }: { block: TableBlock }) {
  const numeric = useMemo(() => {
    return block.head.map((_, col) => {
      if (col === 0) return null;
      const vals = block.rows
        .map((r) => toNumber(r[col] ?? ""))
        .filter((v): v is number => v !== null);
      if (vals.length < block.rows.length || vals.length === 0) return null;
      const span = Math.max(...vals.map(Math.abs), 0.0001);
      return { span, hasNegative: vals.some((v) => v < 0) };
    });
  }, [block]);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left uppercase tracking-wider text-muted-foreground">
              {block.head.map((h, i) => (
                <th key={i} className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/60 last:border-0">
                {block.head.map((_, ci) => {
                  const cell = row[ci] ?? "";
                  const meta = numeric[ci];
                  const v = meta ? toNumber(cell) : null;
                  return (
                    <td
                      key={ci}
                      className={`px-3 py-2 align-middle ${ci ? "text-right" : "font-medium"}`}
                    >
                      {meta && v !== null ? (
                        <span className="relative inline-flex h-6 min-w-[72px] items-center justify-end rounded px-1.5">
                          <span
                            className="absolute inset-y-0.5 right-0 rounded"
                            style={{
                              width: `${(Math.abs(v) / meta.span) * 100}%`,
                              background:
                                v < 0 ? "var(--color-negative)" : "var(--color-chart-1)",
                              opacity: 0.16,
                            }}
                          />
                          <span className="num relative">{cell}</span>
                        </span>
                      ) : (
                        <span className={ci ? "num" : ""}>{cell}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export function AnalystAnswer({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return (
    <div className="space-y-4">
      {blocks.map((b, i) =>
        b.kind === "table" ? (
          <DataTable key={i} block={b} />
        ) : (
          <div
            key={i}
            className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-headings:mb-1 prose-headings:mt-3 prose-h2:text-xs prose-h2:font-semibold prose-h2:uppercase prose-h2:tracking-[0.18em] prose-h2:text-muted-foreground prose-p:my-1.5 prose-li:my-0.5"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text}</ReactMarkdown>
          </div>
        ),
      )}
    </div>
  );
}
