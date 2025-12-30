"use client";

import { X } from "lucide-react";
import { useState } from "react";

export type InventoryItem = {
  id: number;
  name: string;
  itemId: string;
  quantity: number;
  cost: number;
  availability: "In Stock" | "Out of Stock";
  image: string;
};

type Props = {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
};

export default function EditItemModal({
  open,
  item,
  onClose,
  onSave,
}: Props) {
  // Initialize state with item data
  const [itemName, setItemName] = useState(item?.name || "");
  const [cost, setCost] = useState(item?.cost ? String(item.cost) : "");
  const [quantity, setQuantity] = useState(item?.quantity ? String(item.quantity) : "");
  const [unit, setUnit] = useState("Kg");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(item?.image || "");

  // Reset form when item changes or modal opens
  if (open && item && itemName !== item.name) {
    setItemName(item.name);
    setCost(String(item.cost));
    setQuantity(String(item.quantity));
    setPreview(item.image);
  }

  if (!open || !item) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = () => {
    const updatedItem: InventoryItem = {
      ...item,
      name: itemName,
      cost: Number(cost),
      quantity: Number(quantity),
      image: image ? preview : item.image,
      availability: Number(quantity) > 0 ? "In Stock" : "Out of Stock",
    };
    onSave(updatedItem);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-bg-1"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-bg-2 text-text-white z-50 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Item</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Image */}
        <div className="mb-6">
          <label className="block mb-2 text-sm">Image</label>
          <div className="w-full h-40 bg-bg-2 rounded-lg flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500">Select icon here</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 text-sm"
          />
        </div>

        {/* Item Name */}
        <div className="mb-4">
          <label className="block mb-2 text-sm">Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white focus:outline-none"
          />
        </div>

        {/* Cost */}
        <div className="mb-4">
          <label className="block mb-2 text-sm">Cost</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white focus:outline-none"
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block mb-2 text-sm">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-2text-text-white focus:outline-none"
          />
        </div>

        {/* Unit */}
        <div className="mb-6">
          <label className="block mb-2 text-sm">Unit type</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white focus:outline-none"
          >
            <option value="Kg">Kg</option>
            <option value="Litre">Litre</option>
            <option value="Piece">Piece</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-bg-2 hover:bg-bg-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg bg-primary text-text-black font-semibold hover:bg-secondary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}