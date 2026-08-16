"use client";

import { jsPDF } from "jspdf";
import type { Statement } from "@/lib/statements";
import { yearsFor, valueFor } from "@/lib/statements";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(cell: string) {
  return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function downloadStatementsCsv(
  ticker: string,
  companyName: string,
  statements: Statement[]
) {
  const lines: string[] = [`${companyName} (${ticker}) — Financial Statements`];
  lines.push(`Source: SEC EDGAR. Values in USD (EPS in USD/share).`);
  lines.push("");

  for (const statement of statements) {
    const years = yearsFor(statement);
    lines.push(statement.title);
    lines.push(["Line item", ...years.map(String)].map(csvEscape).join(","));
    for (const row of statement.rows) {
      const cells = years.map((y) => {
        const v = valueFor(row, y);
        return v === null ? "n/a" : String(v);
      });
      lines.push([row.label, ...cells].map(csvEscape).join(","));
    }
    lines.push("");
  }

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
  triggerDownload(blob, `${ticker}-financial-statements.csv`);
}

function fmtCell(v: number | null, isEps: boolean) {
  if (v === null) return "n/a";
  if (isEps) return `$${v.toFixed(2)}`;
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export function downloadStatementsPdf(
  ticker: string,
  companyName: string,
  statements: Statement[]
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 50;

  doc.setFontSize(16);
  doc.text(`${companyName} (${ticker})`, marginX, y);
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    "Financial statements from SEC EDGAR. For informational purposes only — not investment advice.",
    marginX,
    y
  );
  doc.setTextColor(0);
  y += 24;

  for (const statement of statements) {
    const years = yearsFor(statement);
    const colWidth = 90;
    const labelWidth = 160;

    if (y > pageHeight - 100) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(13);
    doc.text(statement.title, marginX, y);
    y += 18;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Line item", marginX, y);
    years.forEach((yr, i) => {
      doc.text(
        String(yr),
        marginX + labelWidth + i * colWidth,
        y,
        { align: "right" }
      );
    });
    y += 6;
    doc.line(marginX, y, marginX + labelWidth + years.length * colWidth, y);
    y += 12;
    doc.setFont("helvetica", "normal");

    for (const row of statement.rows) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 50;
      }
      doc.text(row.label, marginX, y);
      const isEps = row.label.toLowerCase().includes("eps");
      years.forEach((yr, i) => {
        const v = valueFor(row, yr);
        doc.text(
          fmtCell(v, isEps),
          marginX + labelWidth + i * colWidth,
          y,
          { align: "right" }
        );
      });
      y += 16;
    }
    y += 16;
  }

  doc.save(`${ticker}-financial-statements.pdf`);
}
