import * as XLSX from "xlsx";

const sanitizeSheetName = (value) => {
  const fallback = "Donnees";
  const normalized = String(value || fallback).replace(/[\\/*:[\]]/g, " ").trim();
  const safe = normalized || fallback;
  return safe.slice(0, 31);
};

const sanitizeFileName = (value) => {
  const fallback = "export";
  const normalized = String(value || fallback).replace(/[<>:"/\\|*]+/g, "_").trim();
  const safe = normalized || fallback;
  return safe.toLowerCase().endsWith(".xlsx") ? safe : `${safe}.xlsx`;
};

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return value;
};

export const exportRowsToExcel = ({ fileName, sheetName, columns, rows }) => {
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error("columns est obligatoire pour l'export Excel.");
  }

  const safeSheetName = sanitizeSheetName(sheetName);
  const safeFileName = sanitizeFileName(fileName);
  const safeRows = Array.isArray(rows) ? rows : [];

  const worksheetData = [
    columns.map((column) => String(column.label || column.key || "")),
    ...safeRows.map((row) =>
      columns.map((column) => {
        const key = column.key;
        const value = row && key in row ? row[key] : "";
        return normalizeCellValue(value);
      })
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  XLSX.writeFile(workbook, safeFileName, { bookType: "xlsx" });
};
