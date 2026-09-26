"use client";

import { formatPhoneDisplay, normalizePhone } from "@/lib/participation";

export type ParticipationsExportRow = {
  id: number;
  nom: string;
  telephone: string;
  majeur: number;
  created_at: string;
};

function exportFileBaseName() {
  return `maltina-participations-${new Date().toISOString().slice(0, 10)}`;
}

function formatDateForExport(value: string) {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function toSheetRows(rows: ParticipationsExportRow[]) {
  return rows.map((row) => ({
    ID: row.id,
    Nom: row.nom,
    Téléphone: formatPhoneDisplay(normalizePhone(row.telephone)),
    "18+": row.majeur ? "Oui" : "Non",
    Date: formatDateForExport(row.created_at),
  }));
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadParticipationsCsv(rows: ParticipationsExportRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["ID", "Nom", "Téléphone", "18+", "Date"];
  const sheetRows = toSheetRows(rows);
  const lines = [
    header.join(";"),
    ...sheetRows.map((row) =>
      [
        String(row.ID),
        escape(row.Nom),
        escape(row.Téléphone),
        row["18+"] === "Oui" ? "oui" : "non",
        escape(row.Date),
      ].join(";"),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  triggerBlobDownload(blob, `${exportFileBaseName()}.csv`);
}

export async function downloadParticipationsExcel(rows: ParticipationsExportRow[]) {
  const XLSX = await import("xlsx");
  const sheetRows = toSheetRows(rows);
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  worksheet["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }, { wch: 8 }, { wch: 20 }];

  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
  for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const phoneCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 2 })];
    if (phoneCell) {
      phoneCell.t = "s";
      phoneCell.z = "@";
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participations");
  XLSX.writeFile(workbook, `${exportFileBaseName()}.xlsx`);
}
