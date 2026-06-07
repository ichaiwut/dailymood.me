"use client";

import React from "react";
import { A } from "./admin-ui";

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export function DataTable<T extends object>({
  columns,
  rows,
  page = 0,
  pageSize = 50,
  total,
  onPageChange,
  onRowClick,
  emptyText = "ไม่มีข้อมูล",
  rowKey,
  pending,
}: {
  columns: Column<T>[];
  rows: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  rowKey?: (row: T) => string;
  pending?: boolean;
}) {
  const totalPages = total != null ? Math.ceil(total / pageSize) : undefined;

  return (
    <div
      style={{
        ...A.cardFlush,
        opacity: pending ? 0.6 : 1,
        transition: "opacity 200ms",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ ...A.th, width: col.width }}>
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
                  style={{
                    ...A.td,
                    textAlign: "center",
                    color: "var(--ink-3)",
                    padding: 32,
                  }}
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  cursor: onRowClick ? "pointer" : undefined,
                  background:
                    i % 2 === 1 ? "var(--w-tint)" : "var(--w-surface)",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  if (onRowClick)
                    e.currentTarget.style.background = "var(--primary-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    i % 2 === 1 ? "var(--w-tint)" : "var(--w-surface)";
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={A.td}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
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
            color: "var(--w-ink-2)",
            borderTop: "1px solid var(--w-rule)",
          }}
        >
          <span>
            แสดง {rows.length} จาก {total?.toLocaleString()} · หน้า{" "}
            {page + 1} / {totalPages}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              style={{ ...A.btnSmall, opacity: page === 0 ? 0.4 : 1 }}
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
              const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + k;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  style={{
                    ...A.btnSmall,
                    background: p === page ? "var(--w-ink)" : "var(--w-surface)",
                    color: p === page ? "var(--bg)" : "var(--w-ink-2)",
                  }}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page + 1 >= totalPages}
              style={{ ...A.btnSmall, opacity: page + 1 >= totalPages ? 0.4 : 1 }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
