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
    //save logic
    console.log({ itemName, cost, quantity, unit, image });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg-2"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-white">Add New Item</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-2">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Item Image */}
        <div className="flex flex-col items-start mb-6">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-2 overflow-hidden">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt="Item"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-500 text-sm">Select icon here</span>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-primary" />
        </div>

        {/* Item Name */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Item Name</label>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Enter Item name"
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Cost */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Cost</label>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Enter cost amount"
            type="number"
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Quantity</label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            type="number"
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Unit type */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-1 block">Unit type</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white focus:outline-none"
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
            className="px-5 py-2 rounded-lg bg-bg-1 text-text-white hover:bg-bg-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-primary text-text-black font-semibold hover:bg-secondary"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
