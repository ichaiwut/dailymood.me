"use client";

import React from "react";

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

const TH: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "var(--ink-3)",
  padding: "10px 14px",
  textAlign: "left",
  borderBottom: "1.5px solid var(--hairline)",
  background: "var(--surface-2)",
};

const TD: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 13,
  color: "var(--ink)",
  borderBottom: "1px solid var(--hairline)",
  verticalAlign: "middle",
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  page = 0,
  pageSize = 50,
  total,
  onPageChange,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}) {
  const totalPages = total != null ? Math.ceil(total / pageSize) : undefined;

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ ...TH, width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ ...TD, textAlign: "center", color: "var(--ink-3)", padding: 32 }}
                >
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? "pointer" : undefined,
                  background: i % 2 === 1 ? "var(--surface-2)" : "var(--surface)",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.background = "#F0EDFA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    i % 2 === 1 ? "var(--surface-2)" : "var(--surface)";
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={TD}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages != null && totalPages > 1 && onPageChange && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 14px",
            fontSize: 13,
            color: "var(--ink-2)",
          }}
        >
          <span>
            หน้า {page + 1} / {totalPages} ({total} รายการ)
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--hairline)",
                background: "var(--surface)",
                cursor: page === 0 ? "default" : "pointer",
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page + 1 >= totalPages}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--hairline)",
                background: "var(--surface)",
                cursor: page + 1 >= totalPages ? "default" : "pointer",
                opacity: page + 1 >= totalPages ? 0.4 : 1,
              }}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
