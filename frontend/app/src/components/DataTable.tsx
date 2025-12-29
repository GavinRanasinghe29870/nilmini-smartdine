"use client";

import { ReactNode } from "react";

type Align = "left" | "right" | "center";

export type Column<T> = {
  key: keyof T | string;
  label?: string;
  align?: Align;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

export default function DataTable<T extends object>({
  columns,
  data,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-bg-2">
      <table className="w-full border-separate border-spacing-0">
        {/* Header */}
        <thead>
          <tr className="text-xs text-gray-400">
            <th className="px-5 py-4 w-10">
              <input type="checkbox" className="accent-primary" />
            </th>

            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-5 py-4 font-medium ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`text-sm transition ${
                rowIndex % 2 === 0 ? "bg-bg-1" : "bg-bg-2"
              } hover:bg-[#1a1d1f]`}
            >
              <td className="px-5 py-4">
                <input type="checkbox" className="accent-primary" />
              </td>

              {columns.map((col) => {
                const value =
                  typeof col.key === "string" && col.key in row
                    ? (row as Record<string, unknown>)[col.key]
                    : undefined;

                return (
                  <td
                    key={String(col.key)}
                    className={`px-5 py-4 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : value != null
                      ? String(value)
                      : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
