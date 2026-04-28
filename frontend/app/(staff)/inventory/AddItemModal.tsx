"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { UnitType } from "../../src/types/inventory";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export default function AddItemModal({ open, onClose, onSave }: Props) {
  const [itemName, setItemName] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<UnitType>("Kg");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setItemName("");
      setCost("");
      setQuantity("");
      setUnit("Kg");
      setImage(null);
      setPreview("");
      setSaving(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview("");
    }
  };

  const handleSave = async () => {
    setError("");

    if (!itemName.trim()) {
      setError("Item name is required");
      return;
    }

    if (!cost || Number(cost) < 0) {
      setError("Valid cost is required");
      return;
    }

    if (!quantity || Number(quantity) < 0) {
      setError("Valid quantity is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", itemName.trim());
    formData.append("cost", cost);
    formData.append("quantity", quantity);
    formData.append("unit", unit);

    if (image) {
      formData.append("image", image);
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to save item"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-white">Add New Item</h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mb-6">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-2 overflow-hidden">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Item preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-500 text-sm">Select image</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm text-primary"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Item Name</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Cost</label>
          <input
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white outline-none"
          >
            <option value="Kg">Kg</option>
            <option value="Litre">Litre</option>
            <option value="Piece">Piece</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-bg-1 text-text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}