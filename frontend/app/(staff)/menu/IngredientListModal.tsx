"use client";

import { ClipboardList, Download, Printer, X } from "lucide-react";
import DataTable, { Column } from "../../src/components/DataTable";
import type {
  IngredientListItem,
  InventoryRequirementItem,
} from "../../src/types/aiMenu";

type Props = {
  open: boolean;
  onClose: () => void;
  menuDate?: string;
  ingredientList: IngredientListItem[];
  inventoryRequirementList?: InventoryRequirementItem[];
};

type InventoryRow = {
  id: string;
  no: number;
  ingredientName: string;
  requiredQuantity: string;
  availableQuantity: string;
  shortageQuantity: string;
  shortageQuantityNumber: number;
  status: string;
  relatedProductsText: string;
};

function formatToday() {
  return new Date().toLocaleDateString("en-CA");
}

function getStatusClass(status: string) {
  if (status === "Available") {
    return "text-green-400";
  }

  if (status === "Need Stock") {
    return "text-yellow-300";
  }

  if (status === "Not In Inventory" || status === "Unit Mismatch") {
    return "text-red-400";
  }

  return "text-gray-300";
}

function buildFallbackRows(ingredientList: IngredientListItem[]): InventoryRow[] {
  return [...(ingredientList || [])]
    .sort((a, b) =>
      String(a.ingredientName || "").localeCompare(
        String(b.ingredientName || "")
      )
    )
    .map((item, index) => ({
      id: `${item.ingredientName}-${item.unit}-${index}`,
      no: index + 1,
      ingredientName: item.ingredientName || "-",
      requiredQuantity: item.requiredQuantity || "-",
      availableQuantity: "-",
      shortageQuantity: item.requiredQuantity || "-",
      shortageQuantityNumber: Number(item.requiredQuantityNumber || 0),
      status: "Inventory Not Checked",
      relatedProductsText: item.relatedProducts?.join(", ") || "-",
    }));
}

export default function IngredientListModal({
  open,
  onClose,
  menuDate,
  ingredientList,
  inventoryRequirementList = [],
}: Props) {
  if (!open) return null;

  const safeMenuDate = menuDate || "-";

  const inventoryRows: InventoryRow[] =
    inventoryRequirementList.length > 0
      ? [...inventoryRequirementList]
          .sort((a, b) =>
            String(a.ingredientName || "").localeCompare(
              String(b.ingredientName || "")
            )
          )
          .map((item, index) => ({
            id: `${item.ingredientName}-${item.unit}-${index}`,
            no: index + 1,
            ingredientName: item.ingredientName || "-",
            requiredQuantity: item.requiredQuantity || "-",
            availableQuantity: item.availableQuantity || "-",
            shortageQuantity: item.shortageQuantity || "-",
            shortageQuantityNumber: Number(item.shortageQuantityNumber || 0),
            status: item.status || "-",
            relatedProductsText: item.relatedProducts?.join(", ") || "-",
          }))
      : buildFallbackRows(ingredientList);

  const totalNeedStockItems = inventoryRows.filter(
    (item) => item.shortageQuantityNumber > 0
  ).length;

  const handlePrintOrDownloadPdf = () => {
    window.print();
  };

  const columns: Column<InventoryRow>[] = [
    {
      key: "no",
      label: "No",
      align: "center",
      render: (row) => row.no,
    },
    {
      key: "ingredientName",
      label: "Inventory Item",
      render: (row) => (
        <span className="font-medium text-text-white ingredient-print-text-strong">
          {row.ingredientName}
        </span>
      ),
    },
    {
      key: "requiredQuantity",
      label: "Total Required",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-text-white">
          {row.requiredQuantity}
        </span>
      ),
    },
    {
      key: "availableQuantity",
      label: "Current Balance",
      align: "right",
      render: (row) => (
        <span className="text-gray-300">{row.availableQuantity}</span>
      ),
    },
    {
      key: "shortageQuantity",
      label: "Need to Add",
      align: "right",
      render: (row) => (
        <span
          className={
            row.shortageQuantityNumber > 0
              ? "font-bold text-primary"
              : "text-green-400"
          }
        >
          {row.shortageQuantity}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => (
        <span className={`font-medium ${getStatusClass(row.status)}`}>
          {row.status}
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
              Inventory Requirement List
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintOrDownloadPdf}
              disabled={inventoryRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-text-black rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Download PDF
            </button>

            <button
              type="button"
              onClick={handlePrintOrDownloadPdf}
              disabled={inventoryRows.length === 0}
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
              Inventory Requirement List
            </p>

            <p className="text-sm text-gray-400 mt-2 ingredient-print-muted">
              This list is calculated using final predicted menu quantities and
              current inventory balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-10 gap-y-3 mb-6 text-sm">
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
                Total Inventory Items
              </p>
              <p className="text-primary font-semibold ingredient-print-primary">
                {inventoryRows.length}
              </p>
            </div>

            <div>
              <p className="text-gray-400 ingredient-print-muted">
                Items Need Stock
              </p>
              <p className="text-primary font-semibold ingredient-print-primary">
                {totalNeedStockItems}
              </p>
            </div>
          </div>

          {inventoryRows.length === 0 ? (
            <div className="rounded-lg bg-bg-1 border border-white/10 p-8 text-center">
              <p className="text-text-white font-medium">
                No inventory requirements available
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Products without ingredient details are ignored automatically.
              </p>
            </div>
          ) : (
            <div className="ingredient-datatable-print">
              <DataTable columns={columns} data={inventoryRows} />
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 ingredient-print-muted">
            Note: Need to Add = Total Required - Current Balance. If current
            balance is enough, Need to Add becomes 0.
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