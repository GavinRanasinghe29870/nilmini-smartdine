"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function AddItemModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [itemName, setItemName] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Kg");
  const [image, setImage] = useState<File | null>(null);

  if (!open) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSave = () => {
    console.log({ itemName, cost, quantity, unit, image });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-white">
            Add New Item
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Item Image */}
        <div className="mb-6">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-2 overflow-hidden">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt="Item"
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

        {/* Item Name */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">
            Item Name
          </label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1"
          />
        </div>

        {/* Cost */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">
            Cost
          </label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1"
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1"
          />
        </div>

        {/* Unit */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-1">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-1"
          >
            <option>Kg</option>
            <option>Litre</option>
            <option>Piece</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-bg-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-primary text-text-black"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
