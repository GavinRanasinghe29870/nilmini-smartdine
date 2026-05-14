"use client";

import { ClipboardList, Download, Printer, X } from "lucide-react";
import DataTable, { Column } from "../../src/components/DataTable";
import type { IngredientListItem } from "../../src/types/aiMenu";

type Props = {
  open: boolean;
  onClose: () => void;
  menuDate?: string;
  ingredientList: IngredientListItem[];
};

type IngredientRow = {
  id: string;
  no: number;
  ingredientName: string;
  requiredQuantityNumber: number;
  unit: string;
  requiredQuantity: string;
  relatedProductsText: string;
};

function formatToday() {
  return new Date().toLocaleDateString("en-CA");
}

function formatNumber(value: number | string | undefined) {
  const num = Number(value || 0);
  const rounded = Math.round(num * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export default function IngredientListModal({
  open,
  onClose,
  menuDate,
  ingredientList,
}: Props) {
  if (!open) return null;

  const safeMenuDate = menuDate || "-";

  const ingredientRows: IngredientRow[] = [...(ingredientList || [])]
    .sort((a, b) =>
      String(a.ingredientName || "").localeCompare(
        String(b.ingredientName || "")
      )
    )
    .map((item, index) => ({
      id: `${item.ingredientName}-${item.unit}-${index}`,
      no: index + 1,
      ingredientName: item.ingredientName || "-",
      requiredQuantityNumber: Number(item.requiredQuantityNumber || 0),
      unit: item.unit || "-",
      requiredQuantity: item.requiredQuantity || "-",
      relatedProductsText: item.relatedProducts?.join(", ") || "-",
    }));

  const handlePrintOrDownloadPdf = () => {
    window.print();
  };

  const columns: Column<IngredientRow>[] = [
    {
      key: "no",
      label: "No",
      align: "center",
      render: (row) => row.no,
    },
    {
      key: "ingredientName",
      label: "Ingredient",
      render: (row) => (
        <span className="font-medium text-text-white ingredient-print-text-strong">
          {row.ingredientName}
        </span>
      ),
    },
    {
      key: "requiredQuantityNumber",
      label: "Qty Number",
      align: "right",
      render: (row) => formatNumber(row.requiredQuantityNumber),
    },
    {
      key: "unit",
      label: "Unit",
      align: "center",
      render: (row) => row.unit,
    },
    {
      key: "requiredQuantity",
      label: "Required Qty",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-primary ingredient-print-primary">
          {row.requiredQuantity}
        </span>
      ),
    },
    {
      key: "relatedProductsText",
      label: "Used For Products",
      render: (row) => (
        <span className="text-gray-400 ingredient-print-muted">
          {row.relatedProductsText}
        </span>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="ingredient-print-area w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl bg-bg-2 border border-white/10 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ingredient-no-print flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            <h2 className="text-xl font-semibold text-text-white">
              Ingredient List
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrDownloadPdf}
              disabled={ingredientRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-text-black rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Download PDF
            </button>

            <button
              type="button"
              onClick={handlePrintOrDownloadPdf}
              disabled={ingredientRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-bg-1 text-text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-bg-1 text-text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-6 ingredient-print-content">
          <div className="mb-6 text-center">
            <h1 className="text-h2 font-semibold text-primary ingredient-print-primary">
              NILMINI HOTEL
            </h1>
            <p className="text-lg font-medium text-text-white mt-2 ingredient-print-text-strong">
              Ingredient List
            </p>
            <p className="text-sm text-gray-400 mt-2 ingredient-print-muted">
              Generated using the final predicted menu quantities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 mb-6 text-sm">
            <div>
              <p className="text-gray-400 ingredient-print-muted">Menu Date</p>
              <p className="text-text-white font-medium ingredient-print-text-strong">
                {safeMenuDate}
              </p>
            </div>

            <div>
              <p className="text-gray-400 ingredient-print-muted">
                Generated Date
              </p>
              <p className="text-text-white font-medium ingredient-print-text-strong">
                {formatToday()}
              </p>
            </div>

            <div>
              <p className="text-gray-400 ingredient-print-muted">
                Total Ingredients
              </p>
              <p className="text-primary font-semibold ingredient-print-primary">
                {ingredientRows.length}
              </p>
            </div>

            <div>
              <p className="text-gray-400 ingredient-print-muted">Purpose</p>
              <p className="text-text-white font-medium ingredient-print-text-strong">
                Production Preparation
              </p>
            </div>
          </div>

          {ingredientRows.length === 0 ? (
            <div className="rounded-lg bg-bg-1 border border-white/10 p-8 text-center">
              <p className="text-text-white font-medium">
                No ingredients available
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Products without ingredient details are ignored automatically.
              </p>
            </div>
          ) : (
            <div className="ingredient-datatable-print">
              <DataTable columns={columns} data={ingredientRows} />
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 ingredient-print-muted">
            Note: Ingredient quantities are calculated by multiplying each
            product&apos;s one-item ingredient usage by the final menu quantity.
            Products without ingredient details are ignored.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="w-full max-w-[220px]">
              <div className="border-t border-white/30 pt-2 text-left text-xs text-gray-400 ingredient-signature-print">
                Prepared By
              </div>
            </div>

            <div className="w-full max-w-[220px]">
              <div className="border-t border-white/30 pt-2 text-left text-xs text-gray-400 ingredient-signature-print">
                Checked By
              </div>
            </div>

            <div className="w-full max-w-[220px]">
              <div className="border-t border-white/30 pt-2 text-left text-xs text-gray-400 ingredient-signature-print">
                Approved By
              </div>
            </div>
          </div>
        </div>

        <div className="ingredient-no-print flex justify-end px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-text-black rounded-lg font-medium hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}