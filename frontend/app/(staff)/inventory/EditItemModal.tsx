"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { InventoryItem, UnitType } from "../../src/types/inventory";
import { normalizeInventoryUnit } from "../../src/types/inventory";

type Props = {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (id: string, formData: FormData) => Promise<void>;
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

export default function EditItemModal({ open, item, onClose, onSave }: Props) {
  const [itemName, setItemName] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<UnitType>("g");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && item) {
      setItemName(item.name);
      setCost(String(item.cost));
      setQuantity(String(item.quantity));
      setUnit(normalizeInventoryUnit(item.unit));
      setPreview(item.image || "");
      setImage(null);
      setSaving(false);
      setError("");
    }
  }, [open, item]);

  if (!open || !item) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
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
      await onSave(item.id, formData);
      onClose();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to update item"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-40" />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-2 text-text-white z-50 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Item</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mb-6">
          <label className="block mb-2 text-sm">Image</label>
          <div className="w-full h-40 bg-bg-1 rounded-lg flex items-center justify-center overflow-hidden">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500">Select image here</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm">Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm">Cost per selected unit (LKR)</label>
          <input
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm">Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm">Unit type</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitType)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="Piece">Piece</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-bg-1 text-text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary text-text-black font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}